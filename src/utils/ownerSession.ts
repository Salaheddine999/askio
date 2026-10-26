// Remembers which Askio account is signed in on this browser, so the widget
// can tell when a chatbot's owner is trying their own bot (on the Askio
// homepage, or anywhere the browser shares getaskio.xyz storage) and not
// count those chats as a visitor's.
const KEY = "askio_owner_uid";

export function rememberSignedInOwner(uid: string | null) {
  try {
    if (uid) localStorage.setItem(KEY, uid);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the owner's chats are simply counted.
  }
}

export function isOwnerBrowsing(ownerId?: string) {
  if (!ownerId) return false;
  try {
    return localStorage.getItem(KEY) === ownerId;
  } catch {
    return false;
  }
}
