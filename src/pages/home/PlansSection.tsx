import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Badge from "./Badge";
import HatchStrip from "./HatchStrip";

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
    ? "bg-[#3B3531] text-white dark:bg-[#312C28] dark:text-[#F5F5F4]"
    : "bg-[#F7F5F3] text-[#37322F] dark:bg-[#1C1917] dark:text-[#F5F5F4]";

  const mutedClass = featured
    ? "text-[rgba(255,255,255,0.72)] dark:text-[#D6D3D1]"
    : "text-[#6D6662] dark:text-[#A8A29E]";

  const buttonClass = featured
    ? "bg-white text-[#37322F] hover:bg-[#F1EEEA]"
    : "bg-[#3B3531] text-white hover:bg-[#2F2A27] dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]";

  const featureClass = featured
    ? "text-[rgba(255,255,255,0.86)] dark:text-[#E7E5E4]"
    : "text-[#5C5551] dark:text-[#D6D3D1]";

  const checkClass = featured
    ? "text-[#F59E0B] dark:text-[#FBBF24]"
    : "text-[#98A2B3] dark:text-[#A8A29E]";

  const buttonContent = (
    <>
      {ctaLabel}
      <ArrowRight className="ml-2 h-4 w-4" />
    </>
  );

  return (
    <div
      className={`min-h-full p-6 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r last:border-r-0 border-[rgba(55,50,47,0.12)] dark:border-[#44403C] ${cardClass}`}
    >
      <div className="max-w-[290px] mx-auto lg:mx-0">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-[30px] leading-none font-serif">{title}</h3>
          {featured && featuredLabel ? (
            <p className="shrink-0 rounded-full border border-[#C9A66B]/30 bg-[#C9A66B]/12 px-2.5 py-1 text-[10px] font-medium tracking-[0.02em] text-[#E7C27D] dark:border-[#E7C27D]/20 dark:bg-[#E7C27D]/10 dark:text-[#F3D9A3]">
              {featuredLabel}
            </p>
          ) : null}
        </div>
        <p className={`mt-4 text-[15px] leading-8 ${mutedClass}`}>{description}</p>

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
    threshold: 0.1,
  });

  return (
    <motion.section
      ref={plansRef}
      initial={{ opacity: 0, y: 40 }}
      animate={plansInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      id="plans"
      className="border-t border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]"
    >
      <div className="py-20 flex flex-col items-center text-center px-4">
        <Badge text="Plans" />
        <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">
          Pick the right Askio setup
        </h2>
        <p className="mt-3 text-[#57524F] dark:text-[#A8A29E] text-body max-w-xl">
          Unlimited manual chatbots for everyone, with AI reserved for teams
          that need smarter automation.
        </p>
      </div>

      <div className="flex border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
        <HatchStrip />
        <div className="flex-1 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
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
                "No AI-generated replies",
              ]}
            />

            <PlanCard
              title="Professional"
              description="AI tools for teams that need faster setup."
              price="$19"
              priceSuffix="/month"
              subtext="Best for AI-powered chatbot creation and growth."
              ctaLabel="Upgrade to Pro"
              ctaHref="/auth?next=pro-checkout"
              featured
              featuredLabel="Most Popular"
              features={[
                "Everything in Starter",
                "AI FAQ generation",
                "AI persona customization",
                "Deep site crawl for richer FAQs",
                "Up to 10 AI-enabled chatbots",
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
                "Custom onboarding support",
                "Priority coordination",
                "Tailored rollout for larger teams",
                "Custom agreements on request",
              ]}
            />
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
