import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { AlertTriangle, Sparkles } from "lucide-react";
import { auth, db } from "../utils/firebase";
import { AI_USAGE_WARNING_RATIO, PRO_AI_REPLY_LIMIT } from "../utils/pricing";

type Usage = { used: number; limit: number | null };

// Matches the server's usage period: the calendar month in UTC.
function usageMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function resetDateLabel() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Monthly AI replies against the plan's limit. Shown only to plans with AI;
 * warns from 80% and explains what happens at the limit.
 */
const AiUsageMeter: React.FC = () => {
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

  const barColor = reached ? "bg-[#C2410C]" : warning ? "bg-[#D7A43B]" : "bg-[#101723] dark:bg-[#D7DFE5]";

  return (
    <div className="rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F9FCFF] dark:bg-[#1A2533] shadow-sm p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-body-sm font-medium text-[#566273] dark:text-[#9BAABD]">
          <Sparkles className="h-4 w-4" />
          AI replies this month
        </h3>
        <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5] tabular-nums">
          {used.toLocaleString()}
          <span className="text-[#647184] dark:text-[#9BAABD]">
            {limit === null ? " · Unlimited" : ` / ${limit.toLocaleString()}`}
          </span>
        </p>
      </div>

      {limit !== null ? (
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#243040]"
          role="progressbar"
          aria-label="AI replies used this month"
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
              ? `You've used all your AI replies for this month. Your chatbots now answer from your FAQs only, until AI replies reset on ${resetDateLabel()}.`
              : `You've used ${Math.round(ratio * 100)}% of this month's AI replies. When they run out, your chatbots answer from your FAQs only until ${resetDateLabel()}.`}{" "}
            <a
              href="mailto:abw.salaheddine@gmail.com?subject=Askio%20AI%20reply%20limit"
              className="font-medium underline underline-offset-2"
            >
              Need more?
            </a>
          </span>
        </p>
      ) : (
        <p className="mt-3 text-caption text-[#647184] dark:text-[#9BAABD]">
          {limit === null ? "Your plan has no monthly AI reply limit." : `Resets on ${resetDateLabel()}.`}
        </p>
      )}
    </div>
  );
};

export default AiUsageMeter;
