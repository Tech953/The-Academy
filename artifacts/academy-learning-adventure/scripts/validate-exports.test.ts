import assert from 'node:assert/strict';
import test from 'node:test';

import {
  readSlideManifest,
  validateSlideContent,
  type SlideExpectation,
} from './validate-exports';

const representativeExpectations: Array<SlideExpectation> = [
  { position: 1, title: 'The Academy' },
  { position: 30, title: 'Make the return visit worth making.' },
];

test('validates representative PPTX content, including wrapped closing titles', () => {
  assert.doesNotThrow(() =>
    validateSlideContent(
      [
        'THE ACADEMY / SYSTEM PITCH The Academy A GED-focused academic RPG',
        'SYSTEM STATUS Make the return visit worth making. The Academy is a playable place',
      ],
      representativeExpectations,
      'PPTX',
      '/reviewed/academy.pptx',
    ),
  );
});

test('validates representative PDF content and reports the failing slide', () => {
  assert.throws(
    () =>
      validateSlideContent(
        [
          'THE ACADEMY / SYSTEM PITCH The Academy A GED-focused academic RPG',
          'SYSTEM STATUS Make the return visit possible. The Academy is a playable place',
        ],
        representativeExpectations,
        'PDF',
        '/reviewed/academy.pdf',
      ),
    /PDF export slide 30 is missing expected title "Make the return visit worth making\."/,
  );
});

test('reports an unexpectedly empty slide before handoff', () => {
  assert.throws(
    () =>
      validateSlideContent(
        ['The Academy', ''],
        representativeExpectations,
        'PPTX',
        '/reviewed/academy.pptx',
      ),
    /PPTX export slide 1 is unexpectedly empty/,
  );
});

test('uses the manifest titles for the cover and closing vision', () => {
  const manifest = readSlideManifest();

  assert.equal(manifest.length, 30);
  assert.deepEqual(manifest[0], {
    position: 1,
    title: 'The Academy',
  });
  assert.deepEqual(manifest.at(-1), {
    position: 30,
    title: 'Make the return visit worth making.',
  });
});