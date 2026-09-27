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
  { position: 12, title: 'Build a place worth returning to.' },
];

function titleMismatchMessage(
  format: 'PPTX' | 'PDF',
  text: string,
  filePath: string,
): string {
  try {
    validateSlideContent(
      [
        'THE ACADEMY / SYSTEM PITCH The Academy A GED-focused academic RPG',
        text,
      ],
      representativeExpectations,
      format,
      filePath,
    );
  } catch (error) {
    assert(error instanceof Error);
    return error.message;
  }
  assert.fail('Expected a slide title mismatch.');
}

function excerptFromMismatch(message: string): string {
  const serializedExcerpt = message.match(
    /extracted text excerpt: ("(?:\\.|[^"\\])*"): /,
  )?.[1];
  assert.ok(serializedExcerpt);
  return JSON.parse(serializedExcerpt) as string;
}

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
        'DESIGN GOAL Build a place worth returning to. Bring GED practice into one experience',
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
          'DESIGN GOAL\nBuild a place worth coming back to. Bring GED practice into one experience',
        ],
        representativeExpectations,
        'PDF',
        '/reviewed/academy.pdf',
      ),
    /PDF export slide 12 is missing expected title "Build a place worth returning to\."; extracted text excerpt: "DESIGN GOAL Build a place worth coming back to\. Bring GED practice into one experience"/,
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

for (const format of ['PPTX', 'PDF'] as const) {
  test(`keeps a late title clue in a bounded ${format} mismatch excerpt`, () => {
    const longPreamble =
      'LEGAL NOTICE navigation contents and export disclaimer. '.repeat(18);
    const mismatchedTitle = 'Observed title: A different destination.';
    const text = `${longPreamble}\n${mismatchedTitle}`;
    const filePath =
      format === 'PPTX' ? '/reviewed/academy.pptx' : '/reviewed/academy.pdf';
    const message = titleMismatchMessage(format, text, filePath);
    const excerpt = excerptFromMismatch(message);

    assert.ok(
      message.includes(
        `${format} export slide 12 is missing expected title "${representativeExpectations[1].title}"`,
      ),
    );
    assert.ok(excerpt.includes(mismatchedTitle));
    assert.ok(excerpt.includes('...'));
    assert.ok(excerpt.length <= 160);
    assert.ok(!message.includes(longPreamble));
    assert.ok(message.includes(filePath));
  });
}

for (const format of ['PPTX', 'PDF'] as const) {
  test(`quotes and preserves Unicode in ${format} mismatch diagnostics`, () => {
    const longPreamble = 'Partner handoff notice and navigation. '.repeat(16);
    const mismatchedTitle = 'Observed title: "visiting 東京" — café 🚀';
    const text = `${longPreamble}\n${mismatchedTitle}\nA short description follows.`;
    const filePath =
      format === 'PPTX' ? '/reviewed/academy.pptx' : '/reviewed/academy.pdf';
    const message = titleMismatchMessage(format, text, filePath);
    const excerpt = excerptFromMismatch(message);

    assert.ok(
      message.includes(
        'missing expected title "Build a place worth returning to."',
      ),
    );
    assert.ok(
      message.includes('Observed title: \\"visiting 東京\\" — café 🚀'),
    );
    assert.ok(!message.includes('Observed title: "visiting 東京"'));
    assert.ok(excerpt.includes(mismatchedTitle));
    assert.ok(excerpt.length <= 160);
    assert.ok(message.length < 500);
  });
}

for (const format of ['PPTX', 'PDF'] as const) {
  test(`removes terminal controls from ${format} mismatch diagnostics`, () => {
    const longPreamble = 'Partner handoff notice and navigation. '.repeat(16);
    const text = `${longPreamble}\u001b[31mObserved title\u001b[0m \u009b1mwith controls\u009b0m`;
    const filePath =
      format === 'PPTX' ? '/reviewed/academy.pptx' : '/reviewed/academy.pdf';
    const message = titleMismatchMessage(format, text, filePath);
    const excerpt = excerptFromMismatch(message);

    assert.ok(!/\p{Cc}/u.test(message));
    assert.ok(excerpt.includes('Observed title'));
    assert.ok(excerpt.includes('with controls'));
    assert.ok(excerpt.length <= 160);
    assert.ok(message.length < 500);
  });
}

test('reports an unexpectedly empty slide before handoff', () => {
  assert.throws(
    () =>
      validateSlideContent(
        ['The Academy', ''],
        representativeExpectations,
        'PPTX',
        '/reviewed/academy.pptx',
      ),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.equal(
        error.message,
        'PPTX export slide 1 is unexpectedly empty: /reviewed/academy.pptx',
      );
      return true;
    },
  );
});

test('uses the manifest titles for the cover and closing vision', () => {
  const manifest = readSlideManifest();

  assert.equal(manifest.length, 30);
  assert.deepEqual(manifest[0], {
    position: 1,
    title: 'The Academy',
  });
  assert.deepEqual(manifest.find((slide) => slide.position === 12), {
    position: 12,
    title: 'Build a place worth returning to.',
  });
});