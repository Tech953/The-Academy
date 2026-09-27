import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractSourceTitle,
  findSourceTitleIssues,
  type SourceTitleEntry,
} from './validate-slides';

const entries: Array<SourceTitleEntry> = [
  {
    position: 1,
    filepath: 'src/pages/slides/Slide01Cover.tsx',
    title: 'The Academy',
  },
  {
    position: 2,
    filepath: 'src/pages/slides/Slide02Thesis.tsx',
    title: 'A study system with a world around it',
  },
];

test('extracts titles from SlideFrame props and standalone headings', () => {
  assert.equal(
    extractSourceTitle(
      '<SlideFrame title="A study system with a world around it"><div /></SlideFrame>',
    ),
    'A study system with a world around it',
  );
  assert.equal(
    extractSourceTitle(
      [
        "const titlePrefix = 'A constant-backed';",
        'const slideTitle = `${titlePrefix} title`;',
        '<SlideFrame title={slideTitle} />',
      ].join('\n'),
    ),
    'A constant-backed title',
  );
  assert.equal(
    extractSourceTitle(
      '<h1><div>Make the return</div><div>visit worth making.</div></h1>',
    ),
    'Make the return visit worth making.',
  );
});

test('reports source title drift with position and expected/current values', () => {
  const issues = findSourceTitleIssues(entries, (filepath) =>
    filepath.endsWith('Slide01Cover.tsx')
      ? '<h1>The Academy</h1>'
      : [
          "const titlePrefix = 'A different';",
          'const slideTitle = `${titlePrefix} title`;',
          '<SlideFrame title={slideTitle} />',
        ].join('\n'),
  );

  assert.deepEqual(issues, [
    {
      message:
        'Slide 2 source title drift in src/pages/slides/Slide02Thesis.tsx: expected "A study system with a world around it", found "A different title"',
    },
  ]);
});

test('reports unsupported dynamic title expressions with an actionable hint', () => {
  const issues = findSourceTitleIssues(entries.slice(1), () =>
    '<SlideFrame title={getSlideTitle()} />',
  );

  assert.deepEqual(issues, [
    {
      message:
        'Slide 2 source title expression could not be resolved in src/pages/slides/Slide02Thesis.tsx: expected "A study system with a world around it", found dynamic expression "getSlideTitle()". Use a string literal or a local const initialized with a static string.',
    },
  ]);
});

test('reports missing and unreadable source titles without changing manifest errors', () => {
  const issues = findSourceTitleIssues(
    [
      entries[0] as SourceTitleEntry,
      {
        position: 2,
        filepath: 'src/pages/slides/Missing.tsx',
        title: 'Expected title',
      },
    ],
    (filepath) =>
      filepath.endsWith('Slide01Cover.tsx')
        ? '<div>no title</div>'
        : undefined,
  );

  assert.deepEqual(issues, [
    {
      message:
        'Slide 1 source title drift in src/pages/slides/Slide01Cover.tsx: expected "The Academy", found "<missing>"',
    },
    {
      message:
        'Slide 2 source title could not be read in src/pages/slides/Missing.tsx: expected "Expected title", found "<unreadable source>"',
    },
  ]);
});

test('skips SDM entries because their source is not JSX', () => {
  assert.deepEqual(
    findSourceTitleIssues(
      [
        {
          position: 1,
          filepath: 'src/data/slides/one.sdm.yaml',
          title: 'SDM slide',
          kind: 'sdm',
        },
      ],
      () => undefined,
    ),
    [],
  );
});