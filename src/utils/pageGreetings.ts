// Greetings an owner sets for specific pages of their site.

/** A greeting for pages whose address contains `match` (e.g. "/pricing"). */
export type PageGreeting = { match: string; message: string };

/** The first page greeting whose `match` is in this page's address. */
export function pageGreetingFor(rules: PageGreeting[] | undefined, pageUrl: string): PageGreeting | null {
  if (!rules?.length || !pageUrl) return null;
  let address = pageUrl.toLowerCase();
  try {
    const url = new URL(pageUrl);
    address = `${url.pathname}${url.search}`.toLowerCase();
  } catch {
    // Not a full URL; match against it as given.
  }
  return rules.find((r) => r.match && r.message && address.includes(r.match.toLowerCase())) ?? null;
}
