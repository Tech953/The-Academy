import React, { useEffect } from 'react';
import ImportedChart, {
  type ImportedChartModel,
} from '../src/widgets/ImportedChart';

const categories = [
  'Reading comprehension and evidence-based reasoning',
  'Mathematical fluency for everyday decision making',
  'Science concepts and interpreting visual evidence',
  'Historical context and evaluating primary sources',
  'Writing clearly with claims and supporting evidence',
];

const series = [
  {
    name: 'Current achievement across core academic competencies and learner confidence',
    color: '#5470C6',
    values: [72, 68, 75, 64, 80],
  },
  {
    name: 'Target growth in academic achievement, learning independence, and preparedness',
    color: '#EE6666',
    values: [88, 84, 90, 82, 92],
  },
];

const chart: ImportedChartModel = {
  type: 'radar',
  title: 'Radar fallback — label legibility check',
  series: series.map((entry) => ({
    name: entry.name,
    color: entry.color,
    categories,
    values: entry.values,
  })),
};

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

function boundsOf(element: Element): Bounds {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function isInside(inner: Bounds, outer: Bounds): boolean {
  return (
    inner.width > 0 &&
    inner.height > 0 &&
    inner.left >= outer.left - 1 &&
    inner.right <= outer.right + 1 &&
    inner.top >= outer.top - 1 &&
    inner.bottom <= outer.bottom + 1
  );
}

function intersects(left: Bounds, right: Bounds): boolean {
  return (
    Math.min(left.right, right.right) -
      Math.max(left.left, right.left) >
      1 &&
    Math.min(left.bottom, right.bottom) -
      Math.max(left.top, right.top) >
      1
  );
}

function overlapCount(items: Array<Bounds>): number {
  let count = 0;
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      const leftBounds = items[left];
      const rightBounds = items[right];
      if (leftBounds && rightBounds && intersects(leftBounds, rightBounds)) {
        count += 1;
      }
    }
  }
  return count;
}

function renderedText(element: Element): string {
  const lines = Array.from(element.querySelectorAll('tspan'))
    .map((line) => line.textContent?.trim() ?? '')
    .filter(Boolean);
  return lines.length > 0
    ? lines.join(' ')
    : (element.textContent ?? '').trim().replace(/\s+/g, ' ');
}

function publishVisualReport(attempt: number): boolean {
  const frame = document.querySelector('.radar-chart-frame');
  if (!frame) return false;

  const categoryElements = Array.from(
    frame.querySelectorAll<SVGTextElement>('[data-radar-category-label]'),
  );
  const seriesLabelElements = Array.from(
    frame.querySelectorAll<HTMLElement>('[data-radar-series-label]'),
  );
  const seriesItemElements = Array.from(
    frame.querySelectorAll<HTMLElement>('[data-radar-series-item]'),
  );
  const expectedCategoryLabels = categories;
  const expectedSeriesLabels = series.map((entry) => entry.name);
  const frameBounds = boundsOf(frame);
  const categoryBounds = categoryElements.map(boundsOf);
  const seriesLabelBounds = seriesLabelElements.map(boundsOf);
  const seriesItemBounds = seriesItemElements.map(boundsOf);

  const categoryLabelsMatch =
    categoryElements.length === expectedCategoryLabels.length &&
    categoryElements.every((element, index) => {
      const expected = expectedCategoryLabels[index] ?? '';
      return (
        element.getAttribute('aria-label') === expected &&
        renderedText(element) === expected
      );
    });
  const seriesLabelsMatch =
    seriesLabelElements.length === expectedSeriesLabels.length &&
    seriesLabelElements.every((element, index) => {
      const expected = expectedSeriesLabels[index] ?? '';
      return (
        element.getAttribute('aria-label') === expected &&
        renderedText(element) === expected
      );
    });
  const ready =
    categoryLabelsMatch &&
    seriesLabelsMatch &&
    seriesItemElements.length === expectedSeriesLabels.length;

  if (!ready && attempt < 80) return false;

  const categoryInsideFrame = categoryBounds.map((bounds) =>
    isInside(bounds, frameBounds),
  );
  const seriesInsideFrame = seriesItemBounds.map((bounds) =>
    isInside(bounds, frameBounds),
  );
  let categorySeriesOverlaps = 0;
  for (const category of categoryBounds) {
    for (const item of seriesItemBounds) {
      if (intersects(category, item)) categorySeriesOverlaps += 1;
    }
  }

  const report = {
    ready,
    attempt,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    categoryLabels: categoryElements.map(
      (element) => element.getAttribute('aria-label') ?? '',
    ),
    categoryInsideFrame,
    categoryOverlaps: overlapCount(categoryBounds),
    seriesLabels: seriesLabelElements.map(
      (element) => element.getAttribute('aria-label') ?? '',
    ),
    seriesInsideFrame,
    seriesOverlaps: overlapCount(seriesItemBounds),
    categorySeriesOverlaps,
  };

  document.documentElement.setAttribute(
    'data-radar-visual-report',
    encodeURIComponent(JSON.stringify(report)),
  );
  return true;
}

export default function RadarChartVisualCheck() {
  useEffect(() => {
    let attempt = 0;
    let timer: number | undefined;
    const measure = () => {
      if (publishVisualReport(attempt)) return;
      attempt += 1;
      timer = window.setTimeout(measure, 100);
    };

    measure();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="visual-check-page">
      <h1 className="visual-check-heading">
        <span>Radar chart visual check</span>
        <small>1920 × 1080 presentation frame</small>
      </h1>
      <section className="radar-chart-frame" aria-label="Radar chart test frame">
        <ImportedChart chart={chart} />
      </section>
    </main>
  );
}