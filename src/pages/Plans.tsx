import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { redirectToProCheckout } from "../utils/billing";
import { auth } from "../utils/firebase";
import BillingToggle from "../components/BillingToggle";
import { usePlanAccess } from "../hooks/usePlanAccess";
import { COMPANY } from "./legal/company";
import { focusRing } from "./dashboard/styles";
import { PRO_AI_REPLY_LIMIT, PRO_PRICE, proYearlyMonthlyEquivalent, type BillingInterval } from "../utils/pricing";
import { useT } from "../i18n";
import { plansMessages } from "../i18n/messages/plans";

type Cta =
  | { label: string; to: string }
  | { label: string; href: string }
  | { label: string; onClick: () => void }
  | { label: string; current: true }
  | null;

type PlanCardProps = {
  name: string;
  description: string;
  price: string;
  priceSuffix?: string;
  note?: string;
  cta: Cta;
  features: string[];
  featured?: boolean;
  badge?: string;
};

function PlanCard({ name, description, price, priceSuffix, note, cta, features, featured = false, badge }: PlanCardProps) {
  const muted = featured ? "text-white/70 dark:text-[#9BAABD]" : "text-[#566273] dark:text-[#9BAABD]";
  const button = `mt-5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-button transition-colors ${focusRing} ${
    featured
      ? "bg-[#F9FCFF] text-[#101723] hover:bg-[#E7EDF6]"
      : "bg-[#101723] text-white hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6]"
  }`;
  const arrow = <ArrowRight className="h-4 w-4" />;

  let action: React.ReactNode = <div className="mt-5 h-9" aria-hidden />;
  if (cta && "current" in cta) {
    action = (
      <div
        className={`mt-5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-button ring-1 ring-inset ${
          featured ? "text-white/80 ring-white/20" : "text-[#566273] ring-[#D8DFE9] dark:text-[#9BAABD] dark:ring-[#2B3646]"
        }`}
      >
        <Check className="h-4 w-4" />
        {cta.label}
      </div>
    );
  } else if (cta && "onClick" in cta) {
    action = (
      <button type="button" onClick={cta.onClick} className={button}>
        {cta.label}
        {arrow}
      </button>
    );
  } else if (cta && "href" in cta) {
    action = (
      <a href={cta.href} className={button}>
        {cta.label}
        {arrow}
      </a>
    );
  } else if (cta) {
    action = (
      <Link to={cta.to} className={button}>
        {cta.label}
        {arrow}
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-xl p-6 ring-1 ${
        featured
          ? "bg-[#101723] text-white ring-[#101723] dark:bg-[#243040] dark:text-[#E7EDF6] dark:ring-[#39485B]"
          : "bg-[#F9FCFF] text-[#101723] ring-[#D8DFE9] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:ring-[#2B3646]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-lg font-semibold">{name}</h2>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              featured ? "bg-white/10 text-white/90" : "bg-[#E7EDF6] text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className={`mt-1.5 min-h-[2.5rem] text-body-sm ${muted}`}>{description}</p>

      <div className="mt-5 flex h-9 items-baseline gap-1">
        <span className="font-serif text-[36px] leading-none tracking-tight">{price}</span>
        {priceSuffix && <span className={`text-body-sm ${muted}`}>{priceSuffix}</span>}
      </div>
      <p className={`mt-1.5 min-h-[1.25rem] text-caption ${muted}`}>{note}</p>

      {action}

      <div className={`my-6 h-px ${featured ? "bg-white/10" : "bg-[#E7EDF6] dark:bg-[#2B3646]"}`} />

      <ul className="space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className={`flex items-start gap-2.5 text-body-sm ${featured ? "text-white/85 dark:text-[#D7DFE5]" : "text-[#566273] dark:text-[#D7DFE5]"}`}>
            <Check
              className={`mt-[3px] h-4 w-4 shrink-0 ${featured ? "text-white/70" : "text-[#87909D] dark:text-[#9BAABD]"}`}
              strokeWidth={2.5}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Plans: React.FC = () => {
  const t = useT(plansMessages);
  const isAuthenticated = Boolean(auth.currentUser);
  const { plan, loading: planLoading } = usePlanAccess();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const yearly = billingInterval === "yearly";
  const onPaidPlan = isAuthenticated && plan !== "free";

  // What each card offers depends on who's looking: signed-out visitors sign
  // up, Free owners upgrade, Pro owners manage billing. Nothing shows until the
  // plan is known, so the buttons don't flicker.
  const known = !isAuthenticated || !planLoading;
  const starterCta: Cta = !known
    ? null
    : !isAuthenticated
      ? { label: t("startFree"), to: "/auth" }
      : onPaidPlan
        ? null
        : { label: t("currentPlan"), current: true };
  const proCta: Cta = !known
    ? null
    : !isAuthenticated
      ? { label: t("upgrade"), to: yearly ? "/auth?next=pro-checkout&interval=yearly" : "/auth?next=pro-checkout" }
      : onPaidPlan
        ? { label: t("manageBilling"), to: "/settings" }
        : { label: t("upgrade"), onClick: () => void redirectToProCheckout(billingInterval) };

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#101723] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
      <Helmet>
        <title>{`${t("title")} | Askio`}</title>
        <meta name="description" content="Compare Askio plans and choose the right setup for your chatbots." />
      </Helmet>

      <div className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-h2 tracking-tight sm:text-h1">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-body-sm text-[#566273] dark:text-[#9BAABD]">{t("subtitle")}</p>
          </div>
          <div className="shrink-0">
            <BillingToggle
              value={billingInterval}
              onChange={setBillingInterval}
              layoutId="plans-billing-toggle"
              labels={{ monthly: t("monthly"), yearly: t("yearly"), savings: t("savings"), group: t("billingPeriod") }}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <PlanCard
            name="Starter"
            description={t("starterDesc")}
            price="$0"
            priceSuffix={t("perMonth")}
            cta={starterCta}
            features={[t("starterF1"), t("starterF2"), t("starterF3"), t("starterF4"), t("starterF5")]}
          />
          <PlanCard
            name="Pro"
            description={t("proDesc")}
            price={`$${yearly ? PRO_PRICE.yearly : PRO_PRICE.monthly}`}
            priceSuffix={yearly ? t("perYear") : t("perMonth")}
            note={yearly ? t("yearlyNote", { price: proYearlyMonthlyEquivalent() }) : undefined}
            cta={proCta}
            featured
            badge={onPaidPlan ? t("currentPlan") : t("mostPopular")}
            features={[
              t("proF1"),
              t("proF2"),
              t("proF3"),
              t("proF4"),
              t("proF5"),
              t("proF6", { count: PRO_AI_REPLY_LIMIT.toLocaleString(t.lang) }),
              t("proF7"),
              t("proF8"),
            ]}
          />
          <PlanCard
            name="Enterprise"
            description={t("enterpriseDesc")}
            price={t("custom")}
            cta={{
              label: t("talkToSales"),
              href: `mailto:${COMPANY.contactEmail}?subject=${encodeURIComponent("Askio Enterprise plan")}`,
            }}
            features={[t("entF1"), t("entF2"), t("entF3"), t("entF4"), t("entF5"), t("entF6")]}
          />
        </div>

        {!isAuthenticated && (
          <div className="mt-8 text-center">
            <Link
              to="/"
              className={`inline-flex items-center rounded text-body-sm font-medium text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`}
            >
              {t("backHome")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Plans;
