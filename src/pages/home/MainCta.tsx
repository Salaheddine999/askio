import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandIcon } from "../../components/BrandLogo";
import { ctaChip, primaryCta } from "./buttonStyles";

/**
 * The homepage's main sign-up button. On hover or focus the arrow slides out
 * and Askio's bubble slides in, as if a chat is starting.
 */
export default function MainCta({ children }: { children: React.ReactNode }) {
  return (
    <Link to="/auth" className={primaryCta}>
      {children}
      <span className={ctaChip} aria-hidden="true">
        <ArrowRight className="h-4 w-4 transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-6 group-hover:opacity-0 group-focus-visible:translate-x-6 group-focus-visible:opacity-0 motion-reduce:transition-none" />
        <span className="absolute inset-0 flex -translate-x-6 items-center justify-center opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <BrandIcon size={13} />
        </span>
      </span>
    </Link>
  );
}
