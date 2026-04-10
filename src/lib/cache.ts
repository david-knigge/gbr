// Simple in-memory cache with TTL.
// Data changes rarely (admin edits), so a 60s TTL means at most
// 1 Supabase query per minute regardless of traffic.

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const TTL_MS = 60_000; // 60 seconds

export function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expires) {
    return Promise.resolve(entry.data);
  }

  return fetcher().then((data) => {
    store.set(key, { data, expires: Date.now() + TTL_MS });
    return data;
  });
}

// Call after admin edits to bust cache immediately
export function invalidateCache(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}
