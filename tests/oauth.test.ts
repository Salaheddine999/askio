import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for Firestore, so the real OAuth handlers and the MCP
// endpoint run without credentials or network.
const db = vi.hoisted(() => {
  type Doc = Record<string, unknown>;
  const state = { data: {} as Record<string, Record<string, Doc>>, nextId: 1, rateAllow: true };
  const table = (name: string) => (state.data[name] ||= {});

  const docRef = (name: string, id: string) => ({
    id,
    get: async () => ({ id, ref: docRef(name, id), exists: id in table(name), data: () => table(name)[id] }),
    set: async (data: Doc, options?: { merge?: boolean }) => {
      table(name)[id] = options?.merge ? { ...table(name)[id], ...data } : { ...data };
    },
    update: async (data: Doc) => {
      table(name)[id] = { ...table(name)[id], ...data };
    },
    delete: async () => {
      delete table(name)[id];
    },
  });

  const query = (name: string, filters: [string, unknown][] = []) => ({
    where: (field: string, _op: string, value: unknown) => query(name, [...filters, [field, value]]),
    get: async () => {
      const docs = Object.entries(table(name))
        .filter(([, doc]) => filters.every(([field, value]) => doc[field] === value))
        .map(([id, doc]) => ({ id, ref: docRef(name, id), data: () => doc }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    },
  });

  const collection = (name: string) => ({ ...query(name), doc: (id?: string) => docRef(name, id ?? `auto${state.nextId++}`) });

  type Ref = ReturnType<typeof docRef>;
  const runTransaction = async (fn: (t: unknown) => Promise<unknown>) =>
    fn({
      get: (target: Ref) => target.get(),
      set: (ref: Ref, data: Doc, options?: { merge?: boolean }) => void ref.set(data, options),
      delete: (ref: Ref) => void ref.delete(),
    });

  return { state, table, adminDb: { collection, runTransaction } };
});

vi.mock("../api/_lib/firebaseAdmin.js", () => ({ adminDb: db.adminDb, adminAuth: {} }));
vi.mock("../api/_lib/auth.js", () => ({
  requireUser: async (req: { uid?: string }) => {
    if (!req.uid) throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
    return { uid: req.uid };
  },
}));
vi.mock("../api/_lib/rateLimit.js", () => ({ takeRateLimit: async () => db.state.rateAllow, visitorKey: () => "visitor" }));
vi.mock("../api/_lib/aiBudget.js", () => ({ takeAiBudget: async () => true }));
vi.mock("../api/_lib/aiHealth.js", () => ({ noteAiFailure: async () => undefined }));
vi.mock("../api/_lib/safeFetch.js", () => ({ assertPublicUrl: async () => undefined }));
vi.mock("../api/_lib/ai.js", () => ({ generateFaqsFromUrl: async () => [] }));

const { default: oauth, isAllowedRedirectUri } = await import("../api/_lib/oauth.js");
const { default: mcp } = await import("../api/mcp.js");

const HOST = "www.getaskio.xyz";
const REDIRECT = "https://claude.ai/api/mcp/auth_callback";

function fakeRes() {
  const res = {
    statusCode: 0,
    // The tests read many shapes of answer from it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: undefined as any,
    headers: {} as Record<string, string>,
    headersSent: false,
    setHeader: (name: string, value: string) => void (res.headers[name] = value),
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      res.headersSent = true;
      return res;
    },
    end() {
      res.headersSent = true;
      return res;
    },
  };
  return res;
}

async function run(action: string, { body, uid, method = "POST" }: { body?: unknown; uid?: string; method?: string } = {}) {
  const res = fakeRes();
  await oauth({ method, uid, body, headers: { host: HOST } } as never, res as never, action);
  return res;
}

async function ping(bearer: string | null) {
  const res = fakeRes();
  await mcp(
    {
      method: "POST",
      headers: { host: HOST, ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) },
      body: { jsonrpc: "2.0", id: 1, method: "ping" },
    } as never,
    res as never
  );
  return res;
}

/** A PKCE pair, as an app makes before sending the owner to Askio. */
function pkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  return { verifier, challenge: crypto.createHash("sha256").update(verifier).digest("base64url") };
}

async function registerApp(redirectUris = [REDIRECT], name = "Claude") {
  return (await run("register", { body: { client_name: name, redirect_uris: redirectUris } })).body.client_id as string;
}

/** The whole "Allow access" step for owner `uid`; returns what the app receives. */
async function allow(uid: string, clientId: string, challenge: string, extra: Record<string, unknown> = {}) {
  const res = await run("decide", {
    uid,
    body: {
      client_id: clientId,
      redirect_uri: REDIRECT,
      response_type: "code",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state: "xyz",
      allow: true,
      ...extra,
    },
  });
  const url = res.body?.redirectTo ? new URL(res.body.redirectTo) : null;
  return { res, url, code: url?.searchParams.get("code") ?? "" };
}

/** Registers an app, allows it for `uid` and exchanges the code for tokens. */
async function connect(uid: string) {
  const clientId = await registerApp();
  const { verifier, challenge } = pkce();
  const { code } = await allow(uid, clientId, challenge);
  const res = await run("token", {
    body: { grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT },
  });
  return { clientId, tokens: res.body as { access_token: string; refresh_token: string } };
}

beforeEach(() => {
  db.state.data = { users: { owner1: { plan: "pro", subscriptionStatus: "active" }, owner2: { plan: "free" } } };
  db.state.nextId = 1;
  db.state.rateAllow = true;
});

describe("OAuth discovery", () => {
  it("tells an app without a token where to sign in", async () => {
    const res = await ping(null);
    expect(res.statusCode).toBe(401);
    expect(res.headers["WWW-Authenticate"]).toContain(`resource_metadata="https://${HOST}/.well-known/oauth-protected-resource"`);
  });

  it("describes the resource and the authorization server", async () => {
    const resource = await run("resource-metadata", { method: "GET" });
    expect(resource.body).toMatchObject({ resource: `https://${HOST}/api/mcp`, authorization_servers: [`https://${HOST}`] });

    const server = await run("server-metadata", { method: "GET" });
    expect(server.body).toMatchObject({
      issuer: `https://${HOST}`,
      authorization_endpoint: `https://${HOST}/oauth/authorize`,
      token_endpoint: `https://${HOST}/api/account/oauth-token`,
      registration_endpoint: `https://${HOST}/api/account/oauth-register`,
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });
});

describe("OAuth app registration", () => {
  it("registers an app and gives it no secret", async () => {
    const res = await run("register", { body: { client_name: "  Claude\n ", redirect_uris: [REDIRECT] } });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ client_name: "Claude", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" });
    expect(res.body).not.toHaveProperty("client_secret");
    expect(db.table("oauth_clients")[res.body.client_id]).toMatchObject({ name: "Claude", redirectUris: [REDIRECT] });
  });

  it("only accepts safe places to send the owner back to", () => {
    for (const ok of [REDIRECT, "http://localhost:3334/callback", "http://127.0.0.1:8080/cb", "cursor://anysphere.cursor-mcp/oauth/callback"]) {
      expect(isAllowedRedirectUri(ok), ok).toBe(true);
    }
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://evil.example/cb",
      "file:///etc/passwd",
      "https://claude.ai/cb#fragment",
      "not a url",
      "",
      `https://a.example/${"x".repeat(600)}`,
    ]) {
      expect(isAllowedRedirectUri(bad), bad).toBe(false);
    }
  });

  it("refuses bad registrations and too many of them", async () => {
    expect((await run("register", { body: { redirect_uris: ["javascript:alert(1)"] } })).body.error).toBe("invalid_redirect_uri");
    expect((await run("register", { body: {} })).statusCode).toBe(400);
    db.state.rateAllow = false;
    expect((await run("register", { body: { redirect_uris: [REDIRECT] } })).statusCode).toBe(429);
    expect(db.table("oauth_clients")).toEqual({});
  });
});

describe("the Allow access step", () => {
  it("needs a signed-in owner", async () => {
    const clientId = await registerApp();
    const { res } = await allow("", clientId, pkce().challenge);
    expect(res.statusCode).toBe(401);
    expect(db.table("oauth_codes")).toEqual({});
  });

  it("shows who is asking and where the owner goes next", async () => {
    const clientId = await registerApp();
    const body = { client_id: clientId, redirect_uri: REDIRECT, response_type: "code", code_challenge: pkce().challenge, code_challenge_method: "S256" };
    expect((await run("request", { uid: "owner1", body })).body).toEqual({ appName: "Claude", returnsTo: "claude.ai", local: false });

    const local = await registerApp(["http://localhost:3334/callback"], "Claude Code");
    const info = await run("request", { uid: "owner1", body: { ...body, client_id: local, redirect_uri: "http://localhost:3334/callback" } });
    expect(info.body).toEqual({ appName: "Claude Code", returnsTo: "", local: true });
  });

  it("never sends the owner to an address the app didn't register", async () => {
    const clientId = await registerApp();
    const { challenge } = pkce();
    for (const redirect_uri of ["https://evil.example/steal", `${REDIRECT}/../other`, "javascript:alert(1)"]) {
      const { res } = await allow("owner1", clientId, challenge, { redirect_uri });
      expect(res.statusCode, redirect_uri).toBe(400);
      expect(res.body.redirectTo).toBeUndefined();
    }
    expect((await allow("owner1", "unknown-client-id-000", challenge)).res.statusCode).toBe(400);
    expect(db.table("oauth_codes")).toEqual({});
  });

  it("requires PKCE with S256", async () => {
    const clientId = await registerApp();
    expect((await allow("owner1", clientId, "")).res.statusCode).toBe(400);
    expect((await allow("owner1", clientId, pkce().challenge, { code_challenge_method: "plain" })).res.statusCode).toBe(400);
    expect((await allow("owner1", clientId, pkce().challenge, { response_type: "token" })).res.statusCode).toBe(400);
  });

  it("sends the app a refusal when the owner cancels", async () => {
    const clientId = await registerApp();
    const { url } = await allow("owner1", clientId, pkce().challenge, { allow: false });
    expect(url?.origin + url!.pathname).toBe(REDIRECT);
    expect(url?.searchParams.get("error")).toBe("access_denied");
    expect(url?.searchParams.get("state")).toBe("xyz");
    expect(url?.searchParams.get("code")).toBeNull();
    expect(db.table("oauth_codes")).toEqual({});
  });

  it("gives the app a one-time code, stored only as a hash", async () => {
    const clientId = await registerApp();
    const { url, code } = await allow("owner1", clientId, pkce().challenge);
    expect(url?.searchParams.get("state")).toBe("xyz");
    expect(code).toMatch(/^askio_ac_/);
    expect(JSON.stringify(db.table("oauth_codes"))).not.toContain(code);
    expect(Object.values(db.table("oauth_codes"))[0]).toMatchObject({ userId: "owner1", clientId });
  });
});

describe("OAuth tokens", () => {
  it("exchanges a code for tokens that work on the MCP endpoint", async () => {
    const { tokens } = await connect("owner1");
    expect(tokens).toMatchObject({ token_type: "Bearer", expires_in: 3600, scope: "chatbots" });
    expect(tokens.access_token).toMatch(/^askio_at_/);
    expect(JSON.stringify(db.table("oauth_tokens"))).not.toContain(tokens.access_token);
    expect(JSON.stringify(db.table("oauth_tokens"))).not.toContain(tokens.refresh_token);

    expect((await ping(tokens.access_token)).statusCode).toBe(200);
    // A refresh token is not an access token.
    expect((await ping(tokens.refresh_token)).statusCode).toBe(401);
  });

  it("acts as the owner who allowed it, and nobody else", async () => {
    const { tokens } = await connect("owner2");
    db.table("chatbot_configs").theirs = { user_id: "owner1", name: "Not yours", title: "x" };
    const res = fakeRes();
    await mcp(
      {
        method: "POST",
        headers: { host: HOST, authorization: `Bearer ${tokens.access_token}` },
        body: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_chatbots", arguments: {} } },
      } as never,
      res as never
    );
    expect(JSON.parse(res.body.result.content[0].text)).toEqual({ chatbots: [] });
  });

  it("uses a code once, and only with the right verifier, app and address", async () => {
    const clientId = await registerApp();
    const other = await registerApp([REDIRECT], "Other");
    const exchange = (code: string, verifier: string, extra: Record<string, string> = {}) =>
      run("token", {
        body: { grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT, ...extra },
      });

    const attempts: [string, (code: string, verifier: string) => ReturnType<typeof exchange>][] = [
      ["wrong verifier", (code) => exchange(code, pkce().verifier)],
      ["another app", (code, verifier) => exchange(code, verifier, { client_id: other })],
      ["another address", (code, verifier) => exchange(code, verifier, { redirect_uri: "https://evil.example/cb" })],
    ];
    for (const [label, attempt] of attempts) {
      const { verifier, challenge } = pkce();
      const { code } = await allow("owner1", clientId, challenge);
      const res = await attempt(code, verifier);
      expect(res.statusCode, label).toBe(400);
      expect(res.body.error, label).toBe("invalid_grant");
      // A failed try burns the code, so it can't be retried with other guesses.
      expect((await exchange(code, verifier)).body.error, label).toBe("invalid_grant");
    }

    const { verifier, challenge } = pkce();
    const { code } = await allow("owner1", clientId, challenge);
    expect((await exchange(code, verifier)).statusCode).toBe(200);
    expect((await exchange(code, verifier)).body.error).toBe("invalid_grant");
  });

  it("refuses an expired code", async () => {
    const clientId = await registerApp();
    const { verifier, challenge } = pkce();
    const { code } = await allow("owner1", clientId, challenge);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 6 * 60_000);
    try {
      const res = await run("token", {
        body: { grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT },
      });
      expect(res.body.error).toBe("invalid_grant");
    } finally {
      vi.useRealTimers();
    }
  });

  it("refreshes: a new pair each time, and the old refresh token stops working", async () => {
    const { clientId, tokens } = await connect("owner1");
    const refresh = (refresh_token: string, client_id = clientId) =>
      run("token", { body: { grant_type: "refresh_token", refresh_token, client_id } });

    expect((await refresh(tokens.refresh_token, "another-client-id-0000")).body.error).toBe("invalid_grant");

    const next = await refresh(tokens.refresh_token);
    expect(next.statusCode).toBe(200);
    expect(next.body.access_token).not.toBe(tokens.access_token);
    expect((await ping(next.body.access_token)).statusCode).toBe(200);
    expect((await refresh(tokens.refresh_token)).body.error).toBe("invalid_grant");
    expect((await refresh(next.body.refresh_token)).statusCode).toBe(200);
  });

  it("stops accepting an access token after an hour, and says why", async () => {
    const { tokens } = await connect("owner1");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61 * 60_000);
    try {
      const res = await ping(tokens.access_token);
      expect(res.statusCode).toBe(401);
      expect(res.headers["WWW-Authenticate"]).toContain('error="invalid_token"');
    } finally {
      vi.useRealTimers();
    }
  });

  it("answers form posts sent as raw text, and unknown grant types", async () => {
    const clientId = await registerApp();
    const { verifier, challenge } = pkce();
    const { code } = await allow("owner1", clientId, challenge);
    const body = new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT }).toString();
    const res = await run("token", { body });
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("no-store");

    expect((await run("token", { body: { grant_type: "password" } })).body.error).toBe("unsupported_grant_type");
  });
});

describe("connected apps in Settings", () => {
  it("lists an owner's connections and disconnects one for good", async () => {
    const { clientId, tokens } = await connect("owner1");
    await connect("owner2");

    const list = await run("apps-list", { uid: "owner1" });
    expect(list.body.apps).toHaveLength(1);
    expect(list.body.apps[0].name).toBe("Claude");
    const id = list.body.apps[0].id;

    // Refreshing keeps it one connection.
    const next = await run("token", { body: { grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: clientId } });
    expect((await run("apps-list", { uid: "owner1" })).body.apps.map((app: { id: string }) => app.id)).toEqual([id]);

    // Another account can't disconnect it.
    expect((await run("apps-revoke", { uid: "owner2", body: { id } })).statusCode).toBe(404);
    expect((await ping(next.body.access_token)).statusCode).toBe(200);

    expect((await run("apps-revoke", { uid: "owner1", body: { id } })).statusCode).toBe(200);
    expect((await ping(tokens.access_token)).statusCode).toBe(401);
    expect((await ping(next.body.access_token)).statusCode).toBe(401);
    const again = await run("token", { body: { grant_type: "refresh_token", refresh_token: next.body.refresh_token, client_id: clientId } });
    expect(again.body.error).toBe("invalid_grant");
    expect((await run("apps-list", { uid: "owner1" })).body.apps).toEqual([]);
    // The other owner's connection is untouched.
    expect((await run("apps-list", { uid: "owner2" })).body.apps).toHaveLength(1);
  });
});
