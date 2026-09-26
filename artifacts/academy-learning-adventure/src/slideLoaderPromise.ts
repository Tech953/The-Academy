export function createRetryableSlideLoader<T>(
  loader: () => Promise<T>,
): () => Promise<T> {
  let loadPromise: Promise<T> | undefined;

  return () => {
    if (loadPromise) return loadPromise;

    loadPromise = Promise.resolve()
      .then(loader)
      .catch((error: unknown) => {
        loadPromise = undefined;
        throw error;
      });

    return loadPromise;
  };
}