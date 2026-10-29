import React, { useEffect, useMemo, useState } from "react";
import { LiveOrb } from "../../components/LiveOrb";
import { X } from "../../components/icons";
import { orbPropsFor } from "../../utils/orbColors";
import { Chatbot } from "./types";
import { focusRing, surface } from "./ui";
import { useT } from "../../i18n";
import { dashboardMessages } from "../../i18n/messages/dashboard";

// Chatbots whose go-live the owner has already seen, per browser.
const SEEN_KEY = "askio_live_celebrated";
// A go-live is news for two weeks; after that it's just how things are.
const RECENT_MS = 14 * 86_400_000;

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The first time a chatbot loads on the owner's website, Kio smiles once and
 * says where it went live. Shown until dismissed, for the latest one only.
 */
const GoLiveCard: React.FC<{ chatbots: Chatbot[] }> = ({ chatbots }) => {
  const t = useT(dashboardMessages);
  const [seen, setSeen] = useState(readSeen);
  const [happy, setHappy] = useState(true);

  const bot = useMemo(
    () =>
      chatbots
        .filter(
          (c) =>
            c.installedAt &&
            c.lastSeenHost &&
            Date.now() - c.installedAt.getTime() < RECENT_MS &&
            !seen.includes(c.id)
        )
        .sort((a, b) => b.installedAt!.getTime() - a.installedAt!.getTime())[0],
    [chatbots, seen]
  );

  useEffect(() => {
    const id = window.setTimeout(() => setHappy(false), 2400);
    return () => window.clearTimeout(id);
  }, []);

  if (!bot) return null;

  const dismiss = () => {
    const next = [...seen, bot.id];
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next.slice(-100)));
    } catch {
      // Without storage it comes back next visit, until the two weeks are up.
    }
  };

  return (
    <div role="status" className={`${surface} flex items-center gap-4 px-5 py-4`}>
      <LiveOrb size={44} {...orbPropsFor(bot.primaryColor || "#101723")} mood={happy ? "happy" : "idle"} />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-fg">
          {t("liveTitle", { name: bot.title, host: bot.lastSeenHost! })}
        </p>
        <p className="mt-0.5 text-body-sm text-fg-muted">{t("liveBody")}</p>
      </div>
      <button
        onClick={dismiss}
        title={t("liveDismiss")}
        aria-label={t("liveDismiss")}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-ink-55 hover:text-fg dark:hover:bg-ink-820 ${focusRing}`}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default GoLiveCard;
