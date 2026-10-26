import type { ReactNode } from "react";

// The Askio logo: the speech-bubble icon and the "Askio" wordmark. The word
// is Outfit SemiBold (SIL Open Font License) converted to outlines, so it
// looks the same everywhere without loading the font. Both parts use the
// text colour, so they follow light and dark mode; colour them with
// text-* classes. Static copies for emails and other sites are in
// public/brand/.

const BUBBLE =
  "M104 0C46.5624 0 0 46.5624 0 104C0 161.438 46.5624 208 104 208H176.198C233.636 208 280.198 161.438 280.198 104C280.198 46.5624 233.636 0 176.198 0H104ZM39.5372 105.719C39.5372 70.1172 68.3982 41.2562 104 41.2562H176.198C211.8 41.2562 240.661 70.1172 240.661 105.719C240.661 129.196 228.111 149.742 209.353 161.013L209.5 161L143.482 198.146C140.816 199.646 137.521 197.719 137.521 194.66V170.182H104C68.3981 170.182 39.5372 141.321 39.5372 105.719Z";
const WORD =
  "M20 0 303 -703H414L696 0H551L333 -577H383L162 0ZM170 -131V-245H548V-131ZM929 11Q888 11 848.5 0Q809 -11 776 -30.5Q743 -50 719 -78L797 -157Q822 -129 855 -115Q888 -101 928 -101Q960 -101 976.5 -110Q993 -119 993 -137Q993 -157 975.5 -168Q958 -179 930 -186.5Q902 -194 871.5 -203.5Q841 -213 813 -228.5Q785 -244 767.5 -271.5Q750 -299 750 -343Q750 -389 772.5 -423Q795 -457 837 -476Q879 -495 936 -495Q996 -495 1044.5 -474Q1093 -453 1125 -411L1046 -332Q1024 -359 996.5 -371Q969 -383 937 -383Q908 -383 892.5 -374Q877 -365 877 -349Q877 -331 894.5 -321Q912 -311 940 -303.5Q968 -296 998.5 -286.5Q1029 -277 1056.5 -260Q1084 -243 1101.5 -215Q1119 -187 1119 -143Q1119 -72 1068 -30.5Q1017 11 929 11ZM1505 0 1318 -249 1504 -483H1655L1437 -219L1442 -283L1665 0ZM1197 0V-723H1328V0ZM1697 0V-483H1829V0ZM1763 -561Q1731 -561 1710 -582.5Q1689 -604 1689 -636Q1689 -667 1710 -689Q1731 -711 1763 -711Q1796 -711 1816.5 -689Q1837 -667 1837 -636Q1837 -604 1816.5 -582.5Q1796 -561 1763 -561ZM2162 10Q2089 10 2030.5 -23.5Q1972 -57 1937.5 -114.5Q1903 -172 1903 -243Q1903 -314 1937 -370.5Q1971 -427 2030 -460.5Q2089 -494 2161 -494Q2235 -494 2293.5 -460.5Q2352 -427 2386 -370.5Q2420 -314 2420 -243Q2420 -172 2386 -114.5Q2352 -57 2293.5 -23.5Q2235 10 2162 10ZM2161 -112Q2198 -112 2226.5 -128.5Q2255 -145 2270.5 -174.5Q2286 -204 2286 -242Q2286 -280 2270 -309Q2254 -338 2226 -354.5Q2198 -371 2161 -371Q2125 -371 2097 -354.5Q2069 -338 2053 -309Q2037 -280 2037 -242Q2037 -204 2053 -174.5Q2069 -145 2097 -128.5Q2125 -112 2161 -112Z";


/** The wordmark alone, sized by `className`, for large decorative uses such as the footer. */
export function BrandWordmark({ className = "", fill = "currentColor", defs }: { className?: string; fill?: string; defs?: ReactNode }) {
  return (
    <svg viewBox="4 -723 2432 743" overflow="visible" aria-hidden className={className}>
      {defs && <defs>{defs}</defs>}
      <path d={WORD} fill={fill} />
    </svg>
  );
}

type IconProps = { size?: number; className?: string };

/** The bubble on its own, `size` px tall. */
export function BrandIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      viewBox="-3 -3 287 214"
      height={(size * 214) / 208}
      width={(size * 287) / 208}
      fill="currentColor"
      overflow="visible"
      aria-hidden
      className={`shrink-0 ${className}`}
      style={{ margin: -(size * 3) / 208 }}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={BUBBLE} />
      <circle cx="97.124" cy="105.719" r="21.4876" />
      <circle cx="183.074" cy="105.719" r="21.4876" />
    </svg>
  );
}

type LogoProps = IconProps & {
  /** Classes for the word only, e.g. to hide it in a collapsed sidebar. */
  wordClassName?: string;
  label?: string;
};

/** Icon and wordmark together; `size` is the icon's height in px. */
export default function BrandLogo({ size = 20, className = "", wordClassName = "", label = "Askio" }: LogoProps) {
  return (
    <span {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={`inline-flex shrink-0 items-center ${className}`}>
      <BrandIcon size={size} />
      <svg
        viewBox="4 -723 2432 743"
        height={size * 0.8138}
        width={size * 2.6638}
        fill="currentColor"
        overflow="visible"
        aria-hidden
        className={`shrink-0 ${wordClassName}`}
        style={{ marginLeft: size * 0.3025 }}
      >
        <path d={WORD} />
      </svg>
    </span>
  );
}
