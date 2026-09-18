import assert from 'node:assert/strict';
import test from 'node:test';

import { validateInitialEntry } from './validate-bundle';

test('allows the base-path entry and non-chart vendor preloads', () => {
  assert.doesNotThrow(() =>
    validateInitialEntry(`
      <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
      <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-react-abc.js">
    `),
  );
});

test('rejects deferred chart assets in the initial entry', () => {
  assert.throws(
    () =>
      validateInitialEntry(`
        <script type="module" src="/academy-learning-adventure/assets/index-abc.js"></script>
        <link rel="modulepreload" href="/academy-learning-adventure/assets/vendor-charts-abc.js">
      `),
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