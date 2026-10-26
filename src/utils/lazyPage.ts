import { lazy, type ComponentType } from "react";

// After a deploy, a tab opened earlier still asks for the old file names of
// pages it hasn't loaded yet, and those files are gone. Reloading once fetches
// the new version. The timestamp guard stops a reload loop if the file is
// missing for some other reason; the error screen takes over then.

const RELOAD_KEY = "askio_chunk_reload";
const RELOAD_WINDOW_MS = 30_000;

/** True for the errors browsers give when a page's code file can't load. */
export function isChunkLoadError(error: unknown) {
  const message = String((error as Error)?.message || error || "");
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk|ChunkLoadError|MIME type/i.test(
    message
  );
}

/** Reloads the page to pick up a new deploy, at most once every 30 seconds. Returns false if it didn't. */
export function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage we can't guard against a loop, so don't reload.
    return false;
  }
  window.location.reload();
  return true;
}

/** React.lazy that reloads once when the page's file is missing after a deploy. */
// Same constraint as React.lazy, so any page component fits.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((error) => {
      if (isChunkLoadError(error) && reloadForNewVersion()) {
        // The page is reloading; never settle so nothing flashes meanwhile.
        return new Promise<{ default: T }>(() => undefined);
      }
      throw error;
    })
  );
}
