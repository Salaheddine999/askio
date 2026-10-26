import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCountFromServer,
  getDocs,
  limit,
  query as withConstraints,
  startAfter,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

export const PAGE_SIZE = 25;

/**
 * Numbered pages over a Firestore query, with an exact total from a count
 * query. Firestore can't skip to page N, so the last document of each loaded
 * page is kept as a cursor; jumping ahead fetches the pages in between once
 * and caches them. A new `key` (a different query) starts over at page 1.
 */
export function usePaged<T>(
  key: string,
  buildQuery: () => Query<DocumentData>,
  toItem: (doc: QueryDocumentSnapshot<DocumentData>) => T | Promise<T>,
  enabled = true
) {
  const [items, setItems] = useState<T[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ends = useRef<(QueryDocumentSnapshot<DocumentData> | null)[]>([]);
  const cache = useRef(new Map<number, T[]>());
  const latest = useRef(0);
  const build = useRef(buildQuery);
  const map = useRef(toItem);
  build.current = buildQuery;
  map.current = toItem;

  const show = useCallback(async (target: number, fresh = false) => {
    if (fresh) {
      ends.current = [];
      cache.current = new Map();
    }
    const request = ++latest.current;
    const cached = cache.current.get(target);
    if (cached) {
      setItems(cached);
      setPage(target);
      return;
    }
    setLoading(true);
    try {
      const known = Math.min(ends.current.length, target - 1);
      const after = known > 0 ? ends.current[known - 1] : null;
      const base = build.current();
      const count = (target - known) * PAGE_SIZE;
      const snap = await getDocs(after ? withConstraints(base, startAfter(after), limit(count)) : withConstraints(base, limit(count)));
      const mapped = await Promise.all(snap.docs.map((d) => map.current(d)));
      if (request !== latest.current) return;
      for (let p = known + 1; p <= target; p++) {
        const from = (p - known - 1) * PAGE_SIZE;
        cache.current.set(p, mapped.slice(from, from + PAGE_SIZE));
        ends.current[p - 1] = snap.docs[Math.min(from + PAGE_SIZE, snap.docs.length) - 1] ?? null;
      }
      setItems(cache.current.get(target) ?? []);
      setPage(target);
      setError(null);
    } catch (err) {
      console.error("Admin list failed:", err);
      if (request === latest.current) {
        setError(err instanceof Error ? err.message : "Couldn't load this list.");
        setItems((prev) => prev ?? []);
      }
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, []);

  const reload = useCallback(
    async (target?: number) => {
      const [count] = await Promise.all([
        getCountFromServer(build.current())
          .then((s) => s.data().count)
          .catch(() => null),
        show(target ?? 1, true),
      ]);
      setTotal(count);
    },
    [show]
  );

  useEffect(() => {
    if (!enabled) return;
    setItems(null);
    void reload(1);
  }, [key, enabled, reload]);

  /** Replace one item in place on every cached page (after an action). */
  const patch = useCallback((match: (item: T) => boolean, next: T) => {
    setItems((prev) => prev && prev.map((item) => (match(item) ? next : item)));
    cache.current.forEach((list, p) => cache.current.set(p, list.map((item) => (match(item) ? next : item))));
  }, []);

  return {
    items,
    page,
    total,
    totalPages: total === null ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    error,
    goTo: (target: number) => show(target),
    reload: () => reload(page),
    patch,
  };
}

/** "Showing 26–50 of 148" for the pager. */
export const rangeSummary = (page: number, total: number | null, shown: number) =>
  total === null
    ? ""
    : `Showing ${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${((page - 1) * PAGE_SIZE + shown).toLocaleString()} of ${total.toLocaleString()}`;
