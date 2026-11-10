// An AI app sends the owner to /oauth/authorize?…; if they aren't signed in
// yet, that address is kept here (for this tab only) so sign-in or sign-up
// brings them back to it instead of the dashboard.

const KEY = "askio_oauth_return";
const AUTHORIZE_PATH = "/oauth/authorize";

export function rememberOAuthReturn(pathAndQuery: string) {
  try {
    sessionStorage.setItem(KEY, pathAndQuery);
  } catch {
    // No storage (private mode): they land on the dashboard and can start again.
  }
}

/** The page to return to after signing in, if an AI app is waiting. */
export function oauthReturnPath(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    // Only ever our own "Allow access" page, never an address someone planted.
    return value && value.startsWith(`${AUTHORIZE_PATH}?`) ? value : null;
  } catch {
    return null;
  }
}

export function clearOAuthReturn() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
