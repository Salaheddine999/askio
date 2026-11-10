import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireUser } from "./auth.js";
import { adminDb } from "./firebaseAdmin.js";
import { takeRateLimit, visitorKey } from "./rateLimit.js";
import { sendError } from "./response.js";

// OAuth 2.1 for the MCP server (api/mcp.js), so an AI app such as Claude or
// ChatGPT can be connected by signing in to Askio and clicking "Allow access",
// with no API key to copy. Askio is both the authorization server and the
// resource server:
//
//   GET  /.well-known/oauth-protected-resource     which server guards /api/mcp (RFC 9728)
//   GET  /.well-known/oauth-authorization-server   where to register, authorize, get tokens (RFC 8414)
//   POST /api/account/oauth-register               an app registers itself (RFC 7591)
//   GET  /oauth/authorize                          the "Allow access" page, in the web app
//   POST /api/account/oauth-request                that page checks the request it was sent
//   POST /api/account/oauth-decide                 the signed-in owner allows or cancels
//   POST /api/account/oauth-token                  code -> tokens, and refresh (PKCE, public clients)
//   POST /api/account/oauth-apps-{list,revoke}     Settings: the apps connected to the account
//
// Codes and tokens are stored only as SHA-256 hashes (the document id), the
// same way API keys are. The browser can't read these collections.

const ACCESS_PREFIX = "askio_at_";
const REFRESH_PREFIX = "askio_rt_";
const CODE_PREFIX = "askio_ac_";
const ACCESS_SHAPE = /^askio_at_[A-Za-z0-9_-]{32}$/;

const CODE_TTL_MS = 5 * 60_000;
const ACCESS_TTL_MS = 60 * 60_000;
/** A connection ends if the app doesn't use it for this long. */
const REFRESH_TTL_MS = 90 * 86_400_000;
const SCOPE = "chatbots";

const REGISTRATIONS_PER_HOUR = 10;
const TOKEN_CALLS_PER_MINUTE = 30;

const MAX_REDIRECT_URIS = 5;
const MAX_URI_CHARS = 500;
const MAX_NAME_CHARS = 80;
const CLIENT_ID = /^[A-Za-z0-9_-]{16,64}$/;
const CHALLENGE = /^[A-Za-z0-9_-]{43,128}$/;
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;
const GRANT_ID = /^[A-Za-z0-9_-]{16,64}$/;
/** Desktop apps that receive the redirect through their own link scheme. */
const APP_SCHEMES = new Set(["cursor:", "vscode:", "vscode-insiders:", "windsurf:"]);

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const random = (bytes = 24) => crypto.randomBytes(bytes).toString("base64url");
const millis = (value) => (typeof value?.toMillis === "function" ? value.toMillis() : null);

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** An error in OAuth's own format: `{ error, error_description }`. */
function oauthError(statusCode, code, description) {
  const error = httpError(statusCode, description);
  error.oauth = code;
  return error;
}

function sendOAuthError(res, error) {
  if (!error.oauth) return sendError(res, error);
  res.setHeader("Cache-Control", "no-store");
  return res.status(error.statusCode).json({ error: error.oauth, error_description: error.message });
}

/** The address this deployment is reached at, e.g. https://www.getaskio.xyz. */
export function originOf(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!/^[A-Za-z0-9.-]+(:\d+)?$/.test(host)) return (process.env.APP_URL || "https://www.getaskio.xyz").replace(/\/$/, "");
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}

export const resourceMetadataUrl = (req) => `${originOf(req)}/.well-known/oauth-protected-resource`;

/**
 * Where an app may be sent back to: an https page, a port on this computer
 * (command-line tools), or a known desktop app's own link. Never a
 * `javascript:` or `data:` address, which would run in the Askio page.
 */
export function isAllowedRedirectUri(value) {
  if (typeof value !== "string" || !value || value.length > MAX_URI_CHARS) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return Boolean(url.hostname);
  if (url.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return APP_SCHEMES.has(url.protocol);
}

/** Where the owner goes next: shown on the "Allow access" page. */
function destinationOf(uri) {
  const url = new URL(uri);
  if (url.protocol === "https:") return { returnsTo: url.host, local: false };
  // A command-line tool or desktop app on the owner's own computer.
  return { returnsTo: url.protocol === "http:" ? "" : url.protocol.replace(":", ""), local: true };
}

const clients = () => adminDb.collection("oauth_clients");
const codes = () => adminDb.collection("oauth_codes");
const tokens = () => adminDb.collection("oauth_tokens");

/** Form posts arrive parsed on Vercel; a raw string is parsed here. */
function formBody(req) {
  const body = req.body;
  if (typeof body === "string") return Object.fromEntries(new URLSearchParams(body));
  return body && typeof body === "object" ? body : {};
}

const text = (value) => (typeof value === "string" ? value : "");

// ---------------------------------------------------------------- metadata

function metadata(req, res, kind) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const origin = originOf(req);
  res.setHeader("Cache-Control", "public, max-age=3600");
  if (kind === "resource") {
    return res.status(200).json({
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: [SCOPE],
      bearer_methods_supported: ["header"],
      resource_name: "Askio",
    });
  }
  return res.status(200).json({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/account/oauth-token`,
    registration_endpoint: `${origin}/api/account/oauth-register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
  });
}

// ------------------------------------------------------------ registration

async function register(req, res) {
  // Anyone can register an app, so this is limited per visitor. A registered
  // app can do nothing until an owner allows it on the "Allow access" page.
  if (!(await takeRateLimit(`oauth_reg_${visitorKey(req)}`, REGISTRATIONS_PER_HOUR, 60 * 60_000))) {
    throw oauthError(429, "invalid_client_metadata", "Too many registrations. Try again later.");
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  if (redirectUris.length === 0 || redirectUris.length > MAX_REDIRECT_URIS || !redirectUris.every(isAllowedRedirectUri)) {
    throw oauthError(
      400,
      "invalid_redirect_uri",
      `Send 1 to ${MAX_REDIRECT_URIS} redirect_uris: https addresses, or http://localhost for local tools.`
    );
  }

  // Shown to the owner next to the address above; plain text, no line breaks.
  const name = text(body.client_name).replace(/\s+/g, " ").trim().slice(0, MAX_NAME_CHARS) || "An app";
  const clientId = random();
  await clients().doc(clientId).set({ name, redirectUris, createdAt: FieldValue.serverTimestamp() });

  res.setHeader("Cache-Control", "no-store");
  return res.status(201).json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
}

// ------------------------------------------------------- the consent page

/**
 * Checks an authorization request before anything is shown or redirected.
 * Until the app and its redirect address are known to match, a problem is
 * reported on the page and the browser is never sent anywhere.
 */
async function checkedRequest(params) {
  const clientId = text(params.client_id);
  if (!CLIENT_ID.test(clientId)) throw httpError(400, "This link is missing the app it came from. Start again from your AI app.");
  const snap = await clients().doc(clientId).get();
  if (!snap.exists) throw httpError(400, "Askio doesn't know this app. Start again from your AI app.");

  const client = snap.data();
  const redirectUri = text(params.redirect_uri);
  if (!client.redirectUris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    throw httpError(400, "This link would send you somewhere the app didn't register. Start again from your AI app.");
  }
  if (params.response_type !== "code") throw httpError(400, "This kind of sign-in isn't supported.");
  if (params.code_challenge_method !== "S256" || !CHALLENGE.test(text(params.code_challenge))) {
    throw httpError(400, "The app didn't send the security check Askio requires (PKCE with S256).");
  }
  const state = text(params.state);
  if (state.length > 2000) throw httpError(400, "The app sent too much data.");

  return {
    clientId,
    clientName: client.name,
    redirectUri,
    codeChallenge: params.code_challenge,
    state,
    resource: text(params.resource).slice(0, MAX_URI_CHARS),
  };
}

function redirectWith(uri, values) {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** POST oauth-request: what the "Allow access" page shows. */
async function describeRequest(req, res) {
  await requireUser(req);
  const request = await checkedRequest(req.body || {});
  return res.status(200).json({ appName: request.clientName, ...destinationOf(request.redirectUri) });
}

/** POST oauth-decide: the signed-in owner allows or cancels; answers with where to go. */
async function decide(req, res) {
  const { uid } = await requireUser(req);
  const body = req.body || {};
  const request = await checkedRequest(body);

  if (body.allow !== true) {
    return res.status(200).json({
      redirectTo: redirectWith(request.redirectUri, { error: "access_denied", state: request.state }),
    });
  }

  const code = CODE_PREFIX + random();
  await codes().doc(hash(code)).set({
    userId: uid,
    clientId: request.clientId,
    clientName: request.clientName,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    resource: request.resource,
    expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
  });
  return res.status(200).json({ redirectTo: redirectWith(request.redirectUri, { code, state: request.state }) });
}

// ------------------------------------------------------------------ tokens

/** Writes a new access and refresh token for one connection, inside a transaction. */
function issueTokens(transaction, { userId, clientId, clientName, grantId, connectedAt }) {
  const access = ACCESS_PREFIX + random();
  const refresh = REFRESH_PREFIX + random();
  const shared = { userId, clientId, clientName, grantId, connectedAt };
  transaction.set(tokens().doc(hash(access)), {
    ...shared,
    kind: "access",
    expiresAt: Timestamp.fromMillis(Date.now() + ACCESS_TTL_MS),
  });
  transaction.set(tokens().doc(hash(refresh)), {
    ...shared,
    kind: "refresh",
    lastUsedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + REFRESH_TTL_MS),
  });
  return {
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_MS / 1000,
    refresh_token: refresh,
    scope: SCOPE,
  };
}

const invalidGrant = (description) => oauthError(400, "invalid_grant", description);

async function exchangeCode(params) {
  const code = text(params.code);
  const verifier = text(params.code_verifier);
  if (!code.startsWith(CODE_PREFIX) || !VERIFIER.test(verifier)) throw invalidGrant("The code or code_verifier is missing or malformed.");

  const ref = codes().doc(hash(code));
  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw invalidGrant("This code was already used or never existed.");
    const data = snap.data();
    // A code works once, whatever happens next.
    transaction.delete(ref);

    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const valid =
      millis(data.expiresAt) > Date.now() &&
      data.clientId === text(params.client_id) &&
      data.redirectUri === text(params.redirect_uri) &&
      challenge === data.codeChallenge;
    if (!valid) return null;

    return issueTokens(transaction, {
      userId: data.userId,
      clientId: data.clientId,
      clientName: data.clientName,
      grantId: random(),
      connectedAt: Timestamp.now(),
    });
  });
}

async function refreshTokens(params) {
  const refresh = text(params.refresh_token);
  if (!refresh.startsWith(REFRESH_PREFIX)) throw invalidGrant("The refresh_token is missing or malformed.");

  const ref = tokens().doc(hash(refresh));
  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() : null;
    if (!data || data.kind !== "refresh" || millis(data.expiresAt) <= Date.now() || data.clientId !== text(params.client_id)) {
      return null;
    }
    // Each refresh token works once; the app gets a new one with its new access token.
    transaction.delete(ref);
    return issueTokens(transaction, data);
  });
}

async function token(req, res) {
  if (!(await takeRateLimit(`oauth_tok_${visitorKey(req)}`, TOKEN_CALLS_PER_MINUTE))) {
    throw oauthError(429, "invalid_request", "Too many requests. Try again in a minute.");
  }

  const params = formBody(req);
  let issued;
  if (params.grant_type === "authorization_code") issued = await exchangeCode(params);
  else if (params.grant_type === "refresh_token") issued = await refreshTokens(params);
  else throw oauthError(400, "unsupported_grant_type", "Use authorization_code or refresh_token.");

  if (!issued) throw invalidGrant("This code or token is expired, was already used, or belongs to another app.");

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(issued);
}

/**
 * The account an OAuth access token belongs to, or null when the value isn't
 * shaped like one (so the caller can try it as an API key).
 */
export async function userForAccessToken(bearer) {
  if (!ACCESS_SHAPE.test(bearer)) return null;
  const snap = await tokens().doc(hash(bearer)).get();
  const data = snap.exists ? snap.data() : null;
  if (!data || data.kind !== "access" || millis(data.expiresAt) <= Date.now()) {
    const error = httpError(401, "This access token has expired or was disconnected.");
    error.invalidToken = true;
    throw error;
  }
  return { uid: data.userId, grantId: data.grantId };
}

// --------------------------------------------------- Settings: connected apps

async function listApps(req, res) {
  const { uid } = await requireUser(req);
  const snap = await tokens().where("userId", "==", uid).get();
  const apps = snap.docs
    .map((doc) => doc.data())
    // One refresh token per connection, replaced each time the app refreshes.
    .filter((data) => data.kind === "refresh" && millis(data.expiresAt) > Date.now())
    .map((data) => ({
      id: data.grantId,
      name: data.clientName,
      connectedAt: millis(data.connectedAt),
      lastUsedAt: millis(data.lastUsedAt),
    }))
    .sort((a, b) => (b.connectedAt || 0) - (a.connectedAt || 0));
  return res.status(200).json({ apps });
}

async function revokeApp(req, res) {
  const { uid } = await requireUser(req);
  const id = (req.body || {}).id;
  if (typeof id !== "string" || !GRANT_ID.test(id)) throw httpError(400, "Unknown connection.");

  const snap = await tokens().where("grantId", "==", id).get();
  // Someone else's connection looks the same as one that doesn't exist.
  const mine = snap.docs.filter((doc) => doc.data().userId === uid);
  if (mine.length === 0) throw httpError(404, "Connection not found.");
  await Promise.all(mine.map((doc) => doc.ref.delete()));
  return res.status(200).json({ revoked: true });
}

// ------------------------------------------------------------------ routing

const ROUTES = {
  "resource-metadata": { run: (req, res) => metadata(req, res, "resource"), get: true },
  "server-metadata": { run: (req, res) => metadata(req, res, "server"), get: true },
  register,
  request: describeRequest,
  decide,
  token,
  "apps-list": listApps,
  "apps-revoke": revokeApp,
};

/** /api/account/oauth-{action}; see the list at the top of this file. */
export default async function oauth(req, res, action) {
  const route = ROUTES[action];
  // Browser-based MCP clients ask first whether they may call.
  if (req.method === "OPTIONS") return res.status(204).end();
  if (route.get) return route.run(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    return await route(req, res);
  } catch (error) {
    if (!error.statusCode) console.error(`OAuth ${action} failed:`, error);
    return sendOAuthError(res, error);
  }
}
