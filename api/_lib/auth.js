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
    return await adminAuth.verifyIdToken(token);
  } catch {
    const error = new Error("Invalid authentication token.");
    error.statusCode = 401;
    throw error;
  }
}
