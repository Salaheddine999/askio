import React from "react";
import { orbPropsFor } from "../utils/orbColors";

const DEFAULT_COLOR = "#101723";

/**
 * A static stand-in for the live orb in a chatbot's brand colour: a lit sphere
 * with two eyes. Cheap enough to render many times, unlike a WebGL orb each.
 */
const BotAvatar: React.FC<{ color?: string; size?: number; muted?: boolean }> = ({
  color,
  size = 36,
  muted,
}) => {
  const body = color || DEFAULT_COLOR;
  // Gradients have no single eye colour; light eyes read on any of them.
  const eye = orbPropsFor(body).eyeColor ?? "#F9FCFF";
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center gap-[18%] rounded-full shadow-[0_1px_3px_rgba(16,23,35,0.18)] ring-1 ring-black/10 dark:ring-white/10 ${
        muted ? "grayscale" : ""
      }`}
      style={{ width: size, height: size, background: body }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%), radial-gradient(circle at 70% 85%, rgba(0,0,0,0.18), rgba(0,0,0,0) 55%)",
        }}
      />
      {[0, 1].map((i) => (
        <span key={i} className="relative rounded-full" style={{ width: size * 0.12, height: size * 0.24, background: eye }} />
      ))}
    </span>
  );
};

export default BotAvatar;
