import { createElement, lazy, type ComponentType } from 'react';
import manifestJson from '@/data/slides-manifest.json';
import { sdmSlideDocumentFilename } from '@/.sdm/core/serialization';
import {
  parseSlidesManifest,
  type SlideManifestEntry as SlideEntry,
} from '@/.sdm/core/slidesManifest';
import { SdmSlide } from '@/.sdm/SdmSlide';

export interface SlideComponentProps {
  active?: boolean;
}

export interface LoadedSlide extends SlideEntry {
  Component: ComponentType<SlideComponentProps>;
  preload?: () => Promise<unknown>;
}

type SlideComponent = ComponentType<SlideComponentProps>;
type SlideModuleLoader = () => Promise<{ default: SlideComponent }>;
type LazySlide = {
  Component: SlideComponent;
  preload: () => Promise<unknown>;
};

const slideModules = import.meta.glob<{ default: SlideComponent }>(
  './pages/slides/*.tsx',
);

const sdmModules = import.meta.glob<{ default: unknown }>(
  './data/slides/*.sdm.yaml',
);

function lazySlide(loader: SlideModuleLoader): LazySlide {
  let loadPromise: Promise<{ default: SlideComponent }> | undefined;
  const load = () => {
    loadPromise ??= loader();
    return loadPromise;
  };
  const LazyComponent = lazy(load);
  return {
    Component: function LoadedLazySlide(props: SlideComponentProps) {
      return createElement(LazyComponent, props);
    },
    preload: load,
  };
}

function loadManifestSlides(): SlideEntry[] {
  const parsed = parseSlidesManifest(manifestJson);
  if (parsed.ok) {
    return parsed.entries;
  }

  const firstIssue = parsed.issues[0];
  const issuePath = firstIssue?.path
    ? firstIssue.path.slice(1).replaceAll('/', '.')
    : 'manifest';
  throw new Error(
    `Invalid slide manifest. Run "pnpm run validate-slides" for details. ` +
      `Invalid manifest at ${issuePath}: ${firstIssue?.message}`,
  );
}

function errorSlide(entry: SlideEntry, message: string) {
  return function ErrorSlide() {
    return createElement(
      'div',
      {
        style: {
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background: '#1a1a1a',
          color: '#fca5a5',
          fontFamily: 'monospace',
          fontSize: 16,
          textAlign: 'center',
          border: '4px solid #fca5a5',
          boxSizing: 'border-box',
        },
        'data-sdm-slide-id': entry.id,
      },
      message,
    );
  };
}

const manifestSlides = loadManifestSlides();

export const slides: LoadedSlide[] = [...manifestSlides]
  .sort((a, b) => a.position - b.position)
  .map((entry) => {
    if (entry.kind === 'sdm') {
      const filename = sdmSlideDocumentFilename(entry.id);
      const expectedPath = `src/data/slides/${filename}`;
      const key = `./data/slides/${filename}`;
      const loader = sdmModules[key];
      if (entry.filepath !== expectedPath || !loader) {
        return {
          ...entry,
          Component: errorSlide(
            entry,
            `Slide "${entry.id}" references a missing or inconsistent SDM document. Expected ${expectedPath}. ` +
              'Run "pnpm run validate-slides" for details.',
          ),
        };
      }
      const lazyEntry = lazySlide(async () => {
        const mod = await loader();
        return {
          default: ({ active }: SlideComponentProps) =>
            createElement(SdmSlide, {
              slideId: entry.id,
              initialDocument: mod.default,
              active,
            }),
        };
      });

      return {
        ...entry,
        Component: lazyEntry.Component,
        preload: lazyEntry.preload,
      };
    }

    const filename = entry.filepath.split('/').pop();
    if (!filename) {
      return {
        ...entry,
        Component: errorSlide(
          entry,
          `Slide "${entry.title}" has an invalid filepath: "${entry.filepath}".`,
        ),
      };
    }

    const key = `./pages/slides/${filename}`;
    const loader = slideModules[key];

    if (!loader) {
      const available = Object.keys(slideModules).join(', ');

      return {
        ...entry,
        Component: errorSlide(
          entry,
          `Slide "${entry.title}" references missing file: ${entry.filepath}. ` +
            `Available modules: ${available}`,
        ),
      };
    }

    const lazyEntry = lazySlide(loader);
    return {
      ...entry,
      Component: lazyEntry.Component,
      preload: lazyEntry.preload,
    };
  });

export function prefetchSlide(slide: LoadedSlide | undefined): void {
  if (!slide?.preload) return;
  void slide.preload().catch(() => undefined);
}
