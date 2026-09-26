import assert from 'node:assert/strict';
import test from 'node:test';

import {
  initialAssetRelativePath,
  measureInitialJavaScriptPayload,
  validateInitialEntry,
  validateInitialPayloadBudget,
} from './validate-bundle';

test('allows the base-path entry and non-chart vendor preloads', () => {
  assert.doesNotThrow(() =>
    validateInitialEntry(`
      <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
      <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-react-abc.js">
    `),
  );
});

test('rejects deferred chart assets in the initial entry', () => {
  const document = `
    <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
    <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-charts-abc.js">
  `;

  assert.throws(
    () => validateInitialEntry(document),
    /Initial entry references deferred chart assets/,
  );
  assert.throws(
    () => measureInitialJavaScriptPayload(document, () => 100),
    /Initial entry references deferred chart assets/,
  );
});

test('rejects a direct imported-chart script in the initial entry', () => {
  assert.throws(
    () =>
      validateInitialEntry(`
        <script type="module" src="/academy-learning-adventure/assets/ImportedChart-abc.js"></script>
      `),
    /ImportedChart-abc\.js/,
  );
});

test('measures entry and approved preloads separately under the Academy base path', () => {
  const document = `
    <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
    <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-react-abc.js">
    <link rel="modulepreload" href="/academy-learning-adventure/assets/index-abc.js">
  `;
  const assetSizes = new Map([
    ['/academy-learning-adventure/assets/index-abc.js', 1200],
    ['/academy-learning-adventure/assets/vendor-react-abc.js', 300],
  ]);

  const measurement = measureInitialJavaScriptPayload(document, (reference) => {
    const bytes = assetSizes.get(reference);
    if (bytes === undefined) throw new Error(`Unexpected reference: ${reference}`);
    return bytes;
  });

  assert.deepEqual(
    {
      entryBytes: measurement.entryBytes,
      preloadBytes: measurement.preloadBytes,
      totalBytes: measurement.totalBytes,
    },
    { entryBytes: 1200, preloadBytes: 300, totalBytes: 1500 },
  );
  assert.equal(measurement.assets.length, 2, 'duplicate references count once');
  assert.doesNotThrow(() => validateInitialPayloadBudget(measurement, 1500));
});

test('fails with the entry and preload totals when the initial payload exceeds budget', () => {
  const measurement = measureInitialJavaScriptPayload(
    `
      <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
      <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-react-abc.js">
    `,
    (reference) =>
      reference.endsWith('index-abc.js') ? 1200 : 300,
  );

  assert.throws(
    () => validateInitialPayloadBudget(measurement, 1499),
    /Initial JavaScript payload budget exceeded \(1499 bytes\): entry=1200 bytes; approved preloads=300 bytes; total=1500 bytes[\s\S]*Defer non-critical imports or reduce modulepreloads/,
  );
});

test('maps base-path asset URLs to local files without network access', () => {
  assert.equal(
    initialAssetRelativePath(
      '/academy-learning-adventure/assets/nested/index-abc.js',
    ),
    'nested/index-abc.js',
  );
  assert.equal(
    initialAssetRelativePath('/custom/deck/path/assets/vendor-react-abc.js'),
    'vendor-react-abc.js',
  );
  assert.throws(
    () => initialAssetRelativePath('https://cdn.example.com/app.js'),
    /Cannot measure external initial JavaScript asset offline/,
  );
});