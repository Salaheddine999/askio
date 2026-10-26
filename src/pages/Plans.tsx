import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { redirectToProCheckout } from "../utils/billing";
import { auth } from "../utils/firebase";
import BillingToggle from "../components/BillingToggle";
import { PRO_AI_REPLY_LIMIT, PRO_PRICE, proYearlyMonthlyEquivalent, type BillingInterval } from "../utils/pricing";

type PlanCardProps = {
  title: string;
  description: string;
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
    ? "bg-[#101723] text-white dark:bg-[#243040] dark:text-[#D7DFE5]"
    : "bg-[#F3F7FC] text-[#101723] dark:bg-[#141D2B] dark:text-[#D7DFE5]";

  const mutedClass = featured
    ? "text-[rgba(255,255,255,0.72)] dark:text-[#D7DFE5]"
    : "text-[#566273] dark:text-[#9BAABD]";

  const buttonClass = featured
    ? "bg-[#F9FCFF] text-[#101723] hover:bg-[#E7EDF6]"
    : "bg-[#101723] text-white hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6]";

  const featureClass = featured
    ? "text-[rgba(255,255,255,0.86)] dark:text-[#E7EDF6]"
    : "text-[#566273] dark:text-[#D7DFE5]";

  const checkClass = featured
    ? "text-[#D7DFE5]"
    : "text-[#87909D] dark:text-[#9BAABD]";

  const buttonContent = (
    <>
      {ctaLabel}
      <ArrowRight className="ml-2 h-4 w-4" />
    </>
  );

  return (
    <div
      className={`min-h-full p-6 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r last:border-r-0 border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] ${cardClass}`}
    >
      <div className="max-w-[290px] mx-auto lg:mx-0">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-[30px] leading-none font-serif">{title}</h3>
          {featured && featuredLabel ? (
            <p className="shrink-0 rounded-full border border-[#D7DFE5]/30 bg-[#D7DFE5]/12 px-2.5 py-1 text-[10px] font-medium tracking-[0.02em] text-[#D7DFE5] dark:border-[#D7DFE5]/20 dark:bg-[#D7DFE5]/10 dark:text-[#F3F7FC]">
              {featuredLabel}
            </p>
          ) : null}
        </div>
        <p className={`mt-4 text-[15px] leading-6 ${mutedClass}`}>{description}</p>

        <div className="mt-12">
          <div className="flex items-end gap-1">
            <span className="text-[58px] leading-none font-serif tracking-tight">{price}</span>
            {priceSuffix ? (
              <span className={`mb-2 text-[16px] font-medium ${mutedClass}`}>{priceSuffix}</span>
            ) : null}
          </div>
          <p className={`mt-3 text-[15px] font-medium ${mutedClass}`}>{subtext}</p>
        </div>

        {ctaAction ? (
          <button
            onClick={ctaAction}
            className={`mt-10 inline-flex h-10 w-full items-center justify-center rounded-full text-[15px] font-medium transition-all duration-200 ${buttonClass}`}
          >
            {buttonContent}
          </button>
        ) : external ? (
          <a
            href={ctaHref}
            className={`mt-10 inline-flex h-10 w-full items-center justify-center rounded-full text-[15px] font-medium transition-all duration-200 ${buttonClass}`}
          >
            {buttonContent}
          </a>
        ) : (
          <Link
            to={ctaHref}
            className={`mt-10 inline-flex h-10 w-full items-center justify-center rounded-full text-[15px] font-medium transition-all duration-200 ${buttonClass}`}
          >
            {buttonContent}
          </Link>
        )}

        <div className="mt-12 space-y-3.5">
          {features.map((feature) => (
            <div
              key={feature}
              className={`flex items-start gap-3 text-[15px] leading-7 ${featureClass}`}
            >
              <Check
                className={`h-4 w-4 mt-[7px] shrink-0 ${checkClass}`}
                strokeWidth={2.5}
              />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Plans: React.FC = () => {
  const isAuthenticated = Boolean(auth.currentUser);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const yearly = billingInterval === "yearly";

  return (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B] text-[#101723] dark:text-[#D7DFE5]">
      <Helmet>
        <title>Plans | Askio</title>
        <meta
          name="description"
          content="Compare Askio plans and choose the right setup for your chatbots."
        />
      </Helmet>

      <div className="max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-0 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F9FCFF] dark:bg-[#1A2533] shadow-[0px_0px_0px_4px_rgba(16,23,35,0.05)] rounded-full border border-[rgba(2,6,23,0.08)] dark:border-[#2B3646]">
            <div className="w-2 h-2 rounded-full bg-[#101723] dark:bg-[#D7DFE5]" />
            <span className="text-[#101723] dark:text-[#D7DFE5] text-caption font-medium">
              Plans
            </span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-serif tracking-tight text-[#101723] dark:text-[#D7DFE5]">
            Pick the right Askio setup
          </h1>
          <p className="mt-4 text-[#566273] dark:text-[#9BAABD] text-base sm:text-lg leading-relaxed">
            Unlimited manual chatbots for everyone, with AI reserved for teams
            that need smarter automation.
          </p>
          <div className="mt-8">
            <BillingToggle value={billingInterval} onChange={setBillingInterval} layoutId="plans-billing-toggle" />
          </div>
        </div>

        <div className="mt-12 border-t border-b border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
          <div className="border-t border-l border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <PlanCard
                title="Starter"
                description="Unlimited manual chatbots for getting started."
                price="$0"
                priceSuffix="/month"
                subtext="Best for simple, manual chatbot setups."
                ctaLabel="Start free"
                ctaHref="/auth"
                features={[
                  "Unlimited standard chatbots",
                  "Manual FAQ builder",
                  "Lead capture flows",
                  "Basic chatbot analytics",
                  "Widget in 5 languages",
                  "No AI-generated replies",
                ]}
              />

              <PlanCard
                title="Professional"
                description="AI tools for teams that need faster setup."
                price={`$${yearly ? PRO_PRICE.yearly : PRO_PRICE.monthly}`}
                priceSuffix={yearly ? "/year" : "/month"}
                subtext={
                  yearly
                    ? `${proYearlyMonthlyEquivalent()}/month, billed yearly.`
                    : "Best for AI-powered chatbot creation and growth."
                }
                ctaLabel="Upgrade to Pro"
                ctaHref={yearly ? "/auth?next=pro-checkout&interval=yearly" : "/auth?next=pro-checkout"}
                ctaAction={
                  isAuthenticated
                    ? () => {
                        void redirectToProCheckout(billingInterval);
                      }
                    : null
                }
                featured
                featuredLabel="Most Popular"
                features={[
                  "Everything in Starter",
                  "AI FAQ generation",
                  "AI persona customization",
                  "Deep site crawl for richer FAQs",
                  "Up to 10 AI-enabled chatbots",
                  `${PRO_AI_REPLY_LIMIT.toLocaleString("en-US")} AI replies every month`,
                  "Conversation history, kept 90 days",
                  "Faster premium setup workflow",
                ]}
              />

              <PlanCard
                title="Enterprise"
                description="Custom setup for larger organizations."
                price="Custom"
                subtext="Best for teams that need custom rollout and support."
                ctaLabel="Talk to sales"
                ctaHref="mailto:abw.salaheddine@gmail.com?subject=Askio%20Enterprise%20Plan"
                external
                features={[
                  "Everything in Professional",
                  "More than 10 AI chatbots",
                  "Custom AI reply limits",
                  "Custom onboarding support",
                  "Priority coordination",
                  "Tailored rollout for larger teams",
                  "Custom agreements on request",
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-[#566273] dark:text-[#9BAABD] hover:text-[#101723] dark:hover:text-[#D7DFE5]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Plans;
