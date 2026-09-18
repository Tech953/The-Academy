import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exportDirectoryIssue,
  readSlideManifest,
  validateSlideContent,
  type SlideExpectation,
} from './validate-exports';

const representativeExpectations: Array<SlideExpectation> = [
  { position: 1, title: 'The Academy' },
  { position: 30, title: 'Make the return visit worth making.' },
];

test('explains missing export types and the expected output directory', () => {
  assert.equal(
    exportDirectoryIssue('/reviewed/outputs', 0, 0),
    'Export preflight failed for /reviewed/outputs: missing a PPTX (.pptx) export; missing a PDF (.pdf) export. Expected exactly one PPTX (.pptx) and one PDF (.pdf) in this output directory.',
  );
});

test('explains incomplete export directories without accepting them', () => {
  assert.match(
    exportDirectoryIssue('/reviewed/outputs', 2, 0) ?? '',
    /Export preflight failed for \/reviewed\/outputs: found 2 PPTX \(\.pptx\) exports; expected exactly one; missing a PDF \(\.pdf\) export/,
  );
  assert.equal(exportDirectoryIssue('/reviewed/outputs', 1, 1), undefined);
});

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
          'SYSTEM STATUS\nMake the return visit possible. The Academy is a playable place',
        ],
        representativeExpectations,
        'PDF',
        '/reviewed/academy.pdf',
      ),
    /PDF export slide 30 is missing expected title "Make the return visit worth making\."; extracted text excerpt: "SYSTEM STATUS Make the return visit possible\. The Academy is a playable place"/,
  );
});

test('bounds and sanitizes title mismatch excerpts', () => {
  const longTail = ' unrelated content '.repeat(30);

  assert.throws(
    () =>
      validateSlideContent(
        [
          'THE ACADEMY / SYSTEM PITCH The Academy A GED-focused academic RPG',
          `Wrong title\n${longTail}`,
        ],
        representativeExpectations,
        'PPTX',
        '/reviewed/academy.pptx',
      ),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.match(
        error.message,
        /extracted text excerpt: "Wrong title unrelated content/,
      );
      assert.ok(error.message.includes('...'));
      assert.ok(!error.message.includes(longTail));
      assert.ok(error.message.length < 400);
      return true;
    },
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