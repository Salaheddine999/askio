import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { AlertTriangle } from "./icons";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { AI_USAGE_WARNING_RATIO, PRO_AI_REPLY_LIMIT } from "../utils/pricing";
import { useT, type Lang } from "../i18n";
import { settingsMessages } from "../i18n/messages/settings";
import { COMPANY } from "../pages/legal/company";
import { AiIcon } from "./icons";

type Usage = { used: number; limit: number | null };

// Matches the server's usage period: the calendar month in UTC.
function usageMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function resetDateLabel(lang: Lang) {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString(lang, { month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Monthly AI replies against the plan's limit. Shown only to plans with AI;
 * warns from 80% and explains what happens at the limit.
 */
const AiUsageMeter: React.FC = () => {
  const t = useT(settingsMessages);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let cancelled = false;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data() || {};
        const plan = userData.plan || (userData.isPro ? "pro" : "free");
        if (plan === "free") return;

        const limit: number | null =
          typeof userData.aiReplyLimit === "number"
            ? userData.aiReplyLimit
            : plan === "enterprise"
              ? null
              : PRO_AI_REPLY_LIMIT;

        const usageSnap = await getDoc(doc(db, "ai_usage", `${user.uid}_${usageMonth()}`));
        const used = usageSnap.exists() ? Number(usageSnap.data().replies) || 0 : 0;
        if (!cancelled) setUsage({ used, limit });
      } catch (error) {
        console.error("Error loading AI usage:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!usage) return null;

  const { used, limit } = usage;
  const ratio = limit ? Math.min(used / limit, 1) : 0;
  const reached = limit !== null && used >= limit;
  const warning = limit !== null && !reached && ratio >= AI_USAGE_WARNING_RATIO;

  const barColor = reached ? "bg-[#C2410C]" : warning ? "bg-[#D7A43B]" : "bg-ink-900 dark:bg-ink-130";

  return (
    <div className="rounded-xl border border-ink-120 dark:border-ink-780 bg-ink-25 dark:bg-ink-850 shadow-sm p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-body-sm font-medium text-fg-muted">
          <AiIcon className="h-4 w-4" />
          {t("usageTitle")}
        </h3>
        <p className="text-body-sm font-medium text-fg tabular-nums">
          {used.toLocaleString(t.lang)}
          <span className="text-ink-545 dark:text-ink-325">
            {limit === null ? ` · ${t("usageUnlimited")}` : ` / ${limit.toLocaleString(t.lang)}`}
          </span>
        </p>
      </div>

      {limit !== null ? (
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-70 dark:bg-ink-805"
          role="progressbar"
          aria-label={t("usageAria")}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
        >
          <div className={`h-full rounded-full transition-[width] duration-500 ${barColor}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      ) : null}

      {reached || warning ? (
        <p
          className={`mt-3 flex items-start gap-2 text-caption ${
            reached ? "text-[#C2410C] dark:text-[#F0A27A]" : "text-[#9A6B12] dark:text-[#E5C16D]"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {reached
              ? t("usageReached", { date: resetDateLabel(t.lang) })
              : t("usageWarning", { percent: Math.round(ratio * 100), date: resetDateLabel(t.lang) })}{" "}
            <a
              href={`mailto:${COMPANY.contactEmail}?subject=Askio%20AI%20reply%20limit`}
              className="font-medium underline underline-offset-2"
            >
              {t("usageNeedMore")}
            </a>
          </span>
        </p>
      ) : (
        <p className="mt-3 text-caption text-ink-545 dark:text-ink-325">
          {limit === null ? t("usageNoLimit") : t("usageResetsOn", { date: resetDateLabel(t.lang) })}
        </p>
      )}
    </div>
  );
};

export default AiUsageMeter;
