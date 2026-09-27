import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SDM_FORMAT,
  SDM_SLIDE_HEIGHT,
  SDM_SLIDE_WIDTH,
  SDM_VERSION,
} from '../src/.sdm/core/schema';
import { encodeSlideDocumentText } from '../src/.sdm/core/serialization';
import type { SlideManifestEntry } from '../src/.sdm/core/slidesManifest';
import { repairSlideDocument } from './sdmRepair';
import { validateSdmEntries } from './sdmValidation';

const manifestEntry: SlideManifestEntry = {
  id: 'sdm-title-check',
  position: 37,
  kind: 'sdm',
  filepath: 'src/data/slides/sdm-title-check.sdm.yaml',
  title: 'Manifest title',
  description: 'SDM title validation fixture',
};

function slideDocument(title?: string): Record<string, unknown> {
  return {
    format: SDM_FORMAT,
    version: SDM_VERSION,
    ...(title === undefined ? {} : { title }),
    size: { width: SDM_SLIDE_WIDTH, height: SDM_SLIDE_HEIGHT },
    background: { kind: 'solid', color: { kind: 'rgb', value: '#0F172A' } },
    elements: [],
  };
}

function sourceTitleIssues(
  document: Record<string, unknown>,
): ReturnType<typeof validateSdmEntries>['errors'] {
  const result = validateSdmEntries([manifestEntry], {
    readFile: (filepath) =>
      filepath === manifestEntry.filepath
        ? encodeSlideDocumentText(document)
        : null,
    listFiles: () => [],
  });

  return result.errors.filter((issue) => issue.code === 'source-title');
}

test('accepts an SDM root title that matches the manifest', () => {
  assert.deepEqual(sourceTitleIssues(slideDocument('Manifest title')), []);
  assert.deepEqual(sourceTitleIssues(slideDocument('  Manifest title  ')), []);
});

test('reports changed SDM titles with slide position and expected/current values', () => {
  assert.deepEqual(sourceTitleIssues(slideDocument('Updated source title')), [
    {
      filepath: manifestEntry.filepath,
      code: 'source-title',
      elementIds: [],
      message:
        'Slide 37 source title mismatch: expected "Manifest title", found "Updated source title".',
    },
  ]);
});

test('reports missing SDM titles with slide position and expected/current values', () => {
  const missingTitleIssue = [
    {
      filepath: manifestEntry.filepath,
      code: 'source-title',
      elementIds: [],
      message:
        'Slide 37 source title mismatch: expected "Manifest title", found "<missing>".',
    },
  ];
  assert.deepEqual(sourceTitleIssues(slideDocument()), missingTitleIssue);
  assert.deepEqual(sourceTitleIssues(slideDocument('   ')), missingTitleIssue);
});

test('SDM repair leaves title metadata unchanged and does not fill it from the manifest', () => {
  const changed = repairSlideDocument(slideDocument('Updated source title'));
  assert.deepEqual(changed.changes, []);
  assert.equal(
    (changed.value as Record<string, unknown>).title,
    'Updated source title',
  );

  const missing = repairSlideDocument(slideDocument());
  assert.equal(
    Object.hasOwn(missing.value as Record<string, unknown>, 'title'),
    false,
  );
});