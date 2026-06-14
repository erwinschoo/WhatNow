/* Map met begrensde concurrency — voor bulk TMDB/OMDb-calls zonder de API te overspoelen. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const ret = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      ret[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}
