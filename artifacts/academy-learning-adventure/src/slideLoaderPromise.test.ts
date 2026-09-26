import assert from 'node:assert/strict';
import test from 'node:test';

import { createRetryableSlideLoader } from './slideLoaderPromise';

test('retries a failed prefetch when navigation loads the target slide', async () => {
  let targetAttempts = 0;
  const targetSlide = { default: 'target slide' };
  const loadTarget = createRetryableSlideLoader(async () => {
    targetAttempts += 1;
    if (targetAttempts === 1) throw new Error('temporary prefetch failure');
    return targetSlide;
  });

  await loadTarget().catch(() => undefined);
  const loadedSlide = await loadTarget();

  assert.equal(loadedSlide, targetSlide);
  assert.equal(targetAttempts, 2);
});

test('propagates a second failure so the slide error boundary can show its fallback', async () => {
  let attempts = 0;
  const loadTarget = createRetryableSlideLoader(async () => {
    attempts += 1;
    throw new Error(`network failure ${attempts}`);
  });

  await loadTarget().catch(() => undefined);
  await assert.rejects(loadTarget(), /network failure 2/);
  assert.equal(attempts, 2);
});

test('shares in-flight loads and keeps successful slide modules cached', async () => {
  let attempts = 0;
  const slideModule = { default: 'loaded slide' };
  const loadTarget = createRetryableSlideLoader(async () => {
    attempts += 1;
    return slideModule;
  });

  const firstLoad = loadTarget();
  const concurrentLoad = loadTarget();

  assert.strictEqual(firstLoad, concurrentLoad);
  assert.equal(await firstLoad, slideModule);
  assert.strictEqual(loadTarget(), firstLoad);
  assert.equal(attempts, 1);
});