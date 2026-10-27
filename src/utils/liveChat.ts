import { doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./db";

// Live chat: the owner's "online" status and the bits both sides share.

/** How often the dashboard says "still online" while the switch is on. */
export const PRESENCE_HEARTBEAT_MS = 60_000;
/** An owner whose last heartbeat is older than this counts as offline. */
const PRESENCE_FRESH_MS = 150_000;
/** How long a visitor waits for someone to answer before the bot takes over. */
export const LIVE_WAIT_MS = 120_000;

export type LiveStatus = "waiting" | "active" | "ended" | "missed";

const ONLINE_KEY = "askio_live_online";

/** Whether this owner chose to be online, remembered per browser. */
export function readOnlineChoice() {
  try {
    return localStorage.getItem(ONLINE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveOnlineChoice(online: boolean) {
  try {
    localStorage.setItem(ONLINE_KEY, online ? "1" : "0");
  } catch {
    // Without storage the switch just starts off next time.
  }
}

/** With push notifications on, going online lasts this long without the dashboard. */
export const PUSH_AVAILABLE_MS = 8 * 60 * 60_000;

/**
 * `availableFor` keeps you online that long after the dashboard closes (for
 * a device with push notifications on, which rings when someone asks).
 */
export function writePresence(uid: string, online: boolean, availableFor = 0) {
  return setDoc(doc(db, "presence", uid), {
    online,
    lastSeen: serverTimestamp(),
    ...(online && availableFor > 0 ? { availableUntil: Timestamp.fromMillis(Date.now() + availableFor) } : {}),
  });
}

/** Reads a presence document: online, and heard from recently or reachable by push. */
export function isPresenceOnline(data: { online?: unknown; lastSeen?: unknown; availableUntil?: unknown } | undefined) {
  if (!data || data.online !== true) return false;
  if (data.availableUntil instanceof Timestamp && data.availableUntil.toMillis() > Date.now()) return true;
  if (!(data.lastSeen instanceof Timestamp)) return false;
  return Date.now() - data.lastSeen.toMillis() < PRESENCE_FRESH_MS;
}

/** A short two-note chime for a visitor asking for you, made on the fly. */
export function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    // No sound available; the badge and notification still show.
  }
}
