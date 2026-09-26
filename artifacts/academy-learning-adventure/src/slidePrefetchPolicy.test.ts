import assert from 'node:assert/strict';
import test from 'node:test';

import { adjacentSlidePrefetchMode } from './slidePrefetchPolicy';

test('keeps existing prefetch behavior when connection hints are unavailable', () => {
  assert.equal(adjacentSlidePrefetchMode(undefined), 'both');
  assert.equal(adjacentSlidePrefetchMode(null), 'both');
});

test('skips adjacent prefetching for Data Saver and 2G connections', () => {
  assert.equal(
    adjacentSlidePrefetchMode({ effectiveType: '4g', saveData: true }),
    'none',
  );
  assert.equal(adjacentSlidePrefetchMode({ effectiveType: 'slow-2g' }), 'none');
  assert.equal(adjacentSlidePrefetchMode({ effectiveType: '2g' }), 'none');
});

test('prefetches only the next slide on 3G', () => {
  assert.equal(adjacentSlidePrefetchMode({ effectiveType: '3g' }), 'next');
});

test('prefetches both adjacent slides on faster or unrecognized connections', () => {
  assert.equal(adjacentSlidePrefetchMode({ effectiveType: '4g' }), 'both');
  assert.equal(adjacentSlidePrefetchMode({ effectiveType: 'unknown' }), 'both');
  assert.equal(adjacentSlidePrefetchMode({ saveData: false }), 'both');
});