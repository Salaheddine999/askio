import { Globe } from "../../components/icons";
import type { IconType } from "react-icons";
import {
  SiAngular,
  SiFramer,
  SiGhost,
  SiHtml5,
  SiNextdotjs,
  SiReact,
  SiShopify,
  SiSquarespace,
  SiVuedotjs,
  SiWebflow,
  SiWix,
  SiWordpress,
} from "react-icons/si";

// Site builders first, then frameworks. The embed works anywhere custom code can go.
// `wordmark` logos already spell the name, so they show without a label.
const PLATFORMS: { name: string; icon: IconType | typeof Globe; wordmark?: boolean }[] = [
  { name: "WordPress", icon: SiWordpress },
  { name: "Shopify", icon: SiShopify },
  { name: "Wix", icon: SiWix, wordmark: true },
  { name: "Webflow", icon: SiWebflow },
  { name: "Squarespace", icon: SiSquarespace },
  { name: "Framer", icon: SiFramer },
  { name: "Ghost", icon: SiGhost },
  { name: "React", icon: SiReact },
  { name: "Next.js", icon: SiNextdotjs },
  { name: "Vue", icon: SiVuedotjs },
  { name: "Angular", icon: SiAngular },
  { name: "HTML", icon: SiHtml5 },
  { name: "Any website", icon: Globe },
];

function PlatformList() {
  return (
    <ul className="flex shrink-0 items-center gap-9 pr-9 sm:gap-12 sm:pr-12">
      {PLATFORMS.map(({ name, icon: Icon, wordmark }) => (
        <li
          key={name}
          className="flex items-center gap-2 whitespace-nowrap text-[14px] font-medium tracking-[-0.01em] text-ink-545 transition-colors duration-200 hover:text-ink-900 dark:text-ink-425 dark:hover:text-ink-70"
        >
          {wordmark ? (
            <Icon className="h-6 w-9 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {name}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function MarqueeStrip() {
  return (
    <section
      className="flex items-stretch overflow-hidden border-b border-[rgba(16,23,35,0.12)] dark:border-ink-780"
      aria-label="Works with"
    >
      <p className="sr-only">Works with {PLATFORMS.map((p) => p.name).join(", ")}.</p>
      <div
        className="flex shrink-0 items-center whitespace-nowrap border-r border-[rgba(16,23,35,0.12)] px-4 text-caption font-medium text-ink-545 sm:px-6 sm:text-xs dark:border-ink-780 dark:text-ink-325"
        aria-hidden="true"
      >
        Works with
      </div>
      <div
        className="group flex min-w-0 flex-1 items-center overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)] sm:py-5"
        aria-hidden="true"
      >
        {/* Two identical lists slide by half their width, so the loop is seamless. */}
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <PlatformList />
          <PlatformList />
        </div>
      </div>
    </section>
  );
}
