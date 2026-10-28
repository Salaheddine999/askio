import { ArrowRight } from "../../components/icons";
import { Link } from "react-router-dom";
import { ctaChip, primaryCta } from "./buttonStyles";

/**
 * The arrow chip on the right of a main button. On hover or focus of the
 * button (a `group`) the arrow nudges forward. `className` adds its tint.
 */
export function ArrowBubble({ className = "" }: { className?: string }) {
  return (
    <span className={`${ctaChip} ${className}`} aria-hidden="true">
      <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none" />
    </span>
  );
}

/** The homepage's main sign-up button. */
export default function MainCta({ children }: { children: React.ReactNode }) {
  return (
    <Link to="/auth" className={primaryCta}>
      {children}
      <ArrowBubble className="bg-white/[0.14] dark:bg-ink-900/[0.08]" />
    </Link>
  );
}
