import { useState } from "react";
import { ArrowRight, Check } from "../../components/icons";
import { ArrowBubble } from "./MainCta";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HatchStrip from "./HatchStrip";
import BillingToggle from "../../components/BillingToggle";
import { COMPANY } from "../legal/company";
import { PRO_AI_REPLY_LIMIT, PRO_PRICE, proYearlyMonthlyEquivalent, type BillingInterval } from "../../utils/pricing";

type PlanCardProps = {
  title: string;
  description: string;
  setupLabel: string;
  price: string;
  priceSuffix?: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  ctaAction?: (() => void) | null;
  features: string[];
  featured?: boolean;
  featuredLabel?: string;
  external?: boolean;
};

function PlanCard({
  title,
  description,
  setupLabel,
  price,
  priceSuffix,
  subtext,
  ctaLabel,
  ctaHref,
  ctaAction,
  features,
  featured = false,
  featuredLabel,
  external = false,
}: PlanCardProps) {
  const cardClass = featured
    ? "bg-ink-900 text-white dark:bg-ink-805 dark:text-ink-130"
    : "bg-ink-30 text-ink-900 dark:bg-ink-875 dark:text-ink-130";

  const mutedClass = featured
    ? "text-[rgba(255,255,255,0.72)] dark:text-ink-130"
    : "text-fg-muted";

  const buttonClass = featured
    ? "bg-ink-130 text-ink-900 hover:bg-ink-30"
    : "bg-ink-900 text-white hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70";

  const featureClass = featured
    ? "text-[rgba(255,255,255,0.86)] dark:text-ink-70"
    : "text-ink-605 dark:text-ink-130";

  const checkClass = featured
    ? "text-ink-130 dark:text-ink-30"
    : "text-ink-425 dark:text-ink-325";

  // The featured plan gets the main buttons' arrow-to-bubble chip at the
  // right edge; a spacer of the same size on the left keeps the label centred.
  const buttonContent = featured ? (
    <span className="flex w-full items-center justify-between px-1.5">
      <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      {ctaLabel}
      <ArrowBubble className="bg-ink-900/[0.08]" />
    </span>
  ) : (
    <>
      {ctaLabel}
      <ArrowRight className="ml-2 h-4 w-4" />
    </>
  );

  return (
    <div
      className={`min-h-full p-6 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r last:border-r-0 border-[rgba(16,23,35,0.12)] dark:border-ink-780 ${cardClass}`}
    >
      <div className="max-w-[290px] mx-auto lg:mx-0">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[28px] leading-none font-display">{title}</h3>
          {featured && featuredLabel ? (
            <p className="shrink-0 -translate-y-0.5 rounded-full border border-ink-130/30 bg-ink-130/12 px-3 py-1.5 text-caption font-medium leading-none tracking-[0.02em] text-ink-130 dark:border-ink-130/20 dark:bg-ink-130/10 dark:text-ink-30">
              {featuredLabel}
            </p>
          ) : null}
        </div>
        <p className={`mt-4 text-xs font-medium uppercase tracking-[0.08em] ${mutedClass}`}>{setupLabel}</p>
        <p className={`mt-2 min-h-[48px] text-[15px] leading-6 ${mutedClass}`}>{description}</p>

        <div className="mt-8">
          <div className="flex items-end gap-1">
            <span className="text-[58px] leading-none font-display tracking-tight">{price}</span>
            {priceSuffix ? (
              <span className={`mb-2 text-[16px] font-medium ${mutedClass}`}>{priceSuffix}</span>
            ) : null}
          </div>
          <p className={`mt-3 min-h-[48px] text-[14px] leading-6 font-medium ${mutedClass}`}>{subtext}</p>
        </div>

        {ctaAction ? (
          <button
            onClick={ctaAction}
            className={`group relative mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-button font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425 ${buttonClass}`}
          >
            {buttonContent}
          </button>
        ) : external ? (
          <a
            href={ctaHref}
            className={`group relative mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-button font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425 ${buttonClass}`}
          >
            {buttonContent}
          </a>
        ) : (
          <Link
            to={ctaHref}
            className={`group relative mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-button font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425 ${buttonClass}`}
          >
            {buttonContent}
          </Link>
        )}

        <div className="mt-8 space-y-3.5">
          <p className={`mb-4 text-xs font-medium ${mutedClass}`}>What’s included</p>
          {features.map((feature) => (
            <div key={feature} className={`flex items-start gap-3 text-[15px] leading-7 ${featureClass}`}>
              <Check className={`h-4 w-4 mt-[7px] shrink-0 ${checkClass}`} strokeWidth={2.5} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlansSection() {
  const [plansRef, plansInView] = useInView({
    triggerOnce: true,
    rootMargin: "0px 0px 200px 0px",
  });
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const yearly = billingInterval === "yearly";

  return (
    <motion.section
      ref={plansRef}
      initial={{ opacity: 0, y: 40 }}
      animate={plansInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      id="plans"
      className="border-t border-b border-[rgba(16,23,35,0.12)] dark:border-ink-780"
    >
      <div className="pt-16 pb-8 sm:pt-20 sm:pb-10 flex flex-col items-center text-center px-4">
        <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-display tracking-tight [text-wrap:balance] text-fg">
          Start free. Add AI when you need it.
        </h2>
        <p className="mt-3 text-fg-muted text-body max-w-xl">
          Starter uses the answers you write. Pro adds AI answers, and lets you jump in and chat with visitors yourself.
        </p>
        <div className="mt-7">
          <BillingToggle value={billingInterval} onChange={setBillingInterval} layoutId="home-billing-toggle" />
        </div>
      </div>

      <div className="flex border-t border-[rgba(16,23,35,0.12)] dark:border-ink-780">
        <HatchStrip />
        <div className="flex-1 border-l border-r border-[rgba(16,23,35,0.12)] dark:border-ink-780">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <PlanCard
              title="Starter"
              setupLabel="Your FAQs · no AI"
              description="Build chatbots with the questions and answers you write."
              price="$0"
              priceSuffix="/month"
              subtext="Unlimited manual chatbots. No AI-generated replies."
              ctaLabel="Start free"
              ctaHref="/auth"
              features={[
                "Unlimited manual chatbots",
                "Write and edit your own FAQs",
                "Custom colors and greeting",
                "Capture visitor contact details",
                "Basic chatbot analytics",
                "Chat in English, French, Dutch, German and Spanish",
              ]}
            />

            <PlanCard
              title="Pro"
              setupLabel="AI and live chat"
              description="AI that answers visitors, plus live chat with them."
              price={`$${yearly ? PRO_PRICE.yearly : PRO_PRICE.monthly}`}
              priceSuffix={yearly ? "/year" : "/month"}
              subtext={
                yearly
                  ? `${proYearlyMonthlyEquivalent()}/month, billed yearly. Everything in Starter, plus up to 10 AI-enabled chatbots.`
                  : "Everything in Starter, plus up to 10 AI-enabled chatbots."
              }
              ctaLabel="Upgrade to Pro"
              ctaHref={yearly ? "/auth?next=pro-checkout&interval=yearly" : "/auth?next=pro-checkout"}
              featured
              featuredLabel="AI included"
              features={[
                "Everything in Starter",
                "Generate FAQs with AI",
                "Customize your AI persona",
                "Deep crawl your website",
                "Up to 10 AI-enabled chatbots",
                `${PRO_AI_REPLY_LIMIT.toLocaleString("en-US")} AI replies every month`,
                "Live chat with visitors, with phone alerts",
                "Read every conversation, kept 90 days",
              ]}
            />

            <PlanCard
              title="Enterprise"
              setupLabel="More than Pro"
              description="More AI chatbots or replies than Pro, set up for you."
              price="Custom"
              subtext={`For more than 10 AI chatbots or ${PRO_AI_REPLY_LIMIT.toLocaleString("en-US")} AI replies a month.`}
              ctaLabel="Contact us"
              ctaHref={`mailto:${COMPANY.contactEmail}?subject=Askio%20Enterprise%20Plan`}
              external
              features={[
                "Everything in Pro",
                "More than 10 AI chatbots",
                "AI reply limits that fit your traffic",
                "Help setting it up, by email",
              ]}
            />
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
