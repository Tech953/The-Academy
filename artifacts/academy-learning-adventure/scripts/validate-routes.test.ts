import assert from 'node:assert/strict';
import test from 'node:test';

import { browserRenderFailure } from './validate-routes';

function renderedDocument(body: string): string {
  return `<!doctype html><html><body><div id="root">${body}</div></body></html>`;
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