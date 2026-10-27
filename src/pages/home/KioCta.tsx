import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LiveOrb } from "../../components/LiveOrb";
import { useSiteDarkMode } from "../../utils/useSiteDarkMode";
import { primaryCta } from "./buttonStyles";

/**
 * The homepage's main button, with Kio riding along: its eyes follow the
 * pointer, it glances at the label when the page opens, and it smiles while
 * the button is hovered or focused.
 */
export default function KioCta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const dark = useSiteDarkMode();
  const [engaged, setEngaged] = useState(false);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Link
      to="/auth"
      className={`${primaryCta} ${className}`}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
    >
      {children}
      <LiveOrb
        size={38}
        variant="custom"
        // The opposite of the button, so Kio stands out on it.
        color={dark ? "#101723" : "#E7EDF6"}
        eyeColor={dark ? "#E7EDF6" : "#101723"}
        mood={engaged ? "happy" : "idle"}
        lookAt={intro && !engaged ? { x: -1, y: 0 } : null}
      />
    </Link>
  );
}
