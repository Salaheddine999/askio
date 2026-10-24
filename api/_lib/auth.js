import { adminAuth } from "./firebaseAdmin.js";

export async function requireUser(req) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.match(/^Bearer (.+)$/i) || [];

  if (!token) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  try {
    // checkRevoked also rejects disabled (suspended) accounts and sessions
    // ended by revokeRefreshTokens, instead of honouring them until they expire.
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    const error = new Error("Invalid authentication token.");
    error.statusCode = 401;
    throw error;
  }
}
