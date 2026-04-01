import { auth } from "./firebase";

type ApiOptions = {
  body?: unknown;
  authRequired?: boolean;
};

export async function apiRequest<T>(
  url: string,
  { body, authRequired = false }: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authRequired) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("You must be logged in to continue.");
    }

    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 504) {
      throw new Error(
        payload.error ||
          "The request took too long to complete. Try again with Deep Crawl turned off or use a smaller page."
      );
    }

    throw new Error(payload.error || `Request failed (${response.status}).`);
  }

  return payload as T;
}
