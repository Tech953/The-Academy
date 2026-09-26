import assert from 'node:assert/strict';
import test from 'node:test';

import {
  browserRenderFailure,
  radarVisualCheckFailure,
} from './validate-routes';

function renderedDocument(body: string): string {
  return `<!doctype html><html><body><div id="root">${body}</div></body></html>`;
}

function radarVisualDocument(report: Record<string, unknown>): string {
  const encoded = encodeURIComponent(JSON.stringify(report));
  return `<!doctype html><html data-radar-visual-report="${encoded}"><body><div id="root"><h1>Radar chart visual check</h1></div></body></html>`;
}

test('accepts a rendered slide with meaningful content and its manifest title', () => {
  assert.equal(
    browserRenderFailure(
      renderedDocument(
        '<div class="deck-frame"><h1>A study system with a world around it</h1></div>',
      ),
      'A study system with a world around it',
    ),
    undefined,
  );
});

test('reports a slide-unavailable fallback with its expected failure', () => {
  assert.equal(
    browserRenderFailure(
      renderedDocument(
        '<div>SLIDE UNAVAILABLE</div><div>Slide 12 could not render.</div>',
      ),
      'Assignments and quizzes make the learning state tangible',
    ),
    'showed the slide-unavailable fallback',
  );
});

test('reports missing rendered titles and runtime overlays', () => {
  assert.equal(
    browserRenderFailure(
      renderedDocument(
        '<div class="deck-frame"><h1>Wrong slide with supporting content</h1></div>',
      ),
      'The Academy is ready',
    ),
    'did not render expected title "The Academy is ready"',
  );
  assert.equal(
    browserRenderFailure(
      '<!doctype html><html><body><div id="root"><vite-error-overlay></vite-error-overlay></div></body></html>',
      'The Academy',
    ),
    'showed a runtime error overlay',
  );
});

test('reports empty rendered content instead of accepting the application shell', () => {
  assert.equal(
    browserRenderFailure(renderedDocument('<div></div>'), 'The Academy'),
    'rendered unexpectedly little visible content',
  );
});

test('accepts readable radar category and series labels at presentation size', () => {
  assert.equal(
    radarVisualCheckFailure(
      radarVisualDocument({
        ready: true,
        viewportWidth: 1920,
        viewportHeight: 1080,
        categoryLabels: [
          'Reading comprehension and evidence-based reasoning',
          'Mathematical fluency for everyday decision making',
          'Science concepts and interpreting visual evidence',
          'Historical context and evaluating primary sources',
          'Writing clearly with claims and supporting evidence',
        ],
        categoryInsideFrame: [true, true, true, true, true],
        categoryOverlaps: 0,
        seriesLabels: [
          'Current achievement across core academic competencies and learner confidence',
          'Target growth in academic achievement, learning independence, and preparedness',
        ],
        seriesInsideFrame: [true, true],
        seriesOverlaps: 0,
        categorySeriesOverlaps: 0,
      }),
    ),
    undefined,
  );
});

test('reports clipped, colliding, or undersized radar label checks', () => {
  const report: Record<string, unknown> = {
    ready: true,
    viewportWidth: 1920,
    viewportHeight: 1080,
    categoryLabels: [
      'Reading comprehension and evidence-based reasoning',
      'Mathematical fluency for everyday decision making',
      'Science concepts and interpreting visual evidence',
      'Historical context and evaluating primary sources',
      'Writing clearly with claims and supporting evidence',
    ],
    categoryInsideFrame: [true, true, true, true, true],
    categoryOverlaps: 0,
    seriesLabels: [
      'Current achievement across core academic competencies and learner confidence',
      'Target growth in academic achievement, learning independence, and preparedness',
    ],
    seriesInsideFrame: [true, true],
    seriesOverlaps: 0,
    categorySeriesOverlaps: 0,
  };

  assert.equal(
    radarVisualCheckFailure(
      radarVisualDocument({ ...report, categoryOverlaps: 1 }),
    ),
    'had category labels or series names that collided',
  );
  assert.equal(
    radarVisualCheckFailure(
      radarVisualDocument({
        ...report,
        seriesInsideFrame: [true, false],
      }),
    ),
    'clipped a category label or series name at the chart frame',
  );
  assert.equal(
    radarVisualCheckFailure(
      radarVisualDocument({ ...report, viewportHeight: 900 }),
    ),
    'was not checked at 1920×1080 presentation size',
  );
});