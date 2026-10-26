import React from "react";
import { orbPropsFor } from "../utils/orbColors";
import chatIcon from "../assets/chat1.svg";

const DEFAULT_COLOR = "#101723";

/**
 * A small picture of a chatbot's launcher in its brand colour, so owners can
 * tell their chatbots apart at a glance: the Kio orb (a lit sphere with two
 * eyes) or the classic chat-bubble button. Static, so it's cheap to render
 * many times, unlike the live WebGL orb.
 */
const BotAvatar: React.FC<{
  color?: string;
  size?: number;
  muted?: boolean;
  /** As saved by the editor; chatbots without one use the classic launcher. */
  launcherStyle?: string;
}> = ({ color, size = 36, muted, launcherStyle }) => {
  const body = color || DEFAULT_COLOR;
  const ring = `relative inline-flex shrink-0 items-center justify-center rounded-full shadow-[0_1px_3px_rgba(16,23,35,0.18)] ring-1 ring-black/10 dark:ring-white/10 ${
    muted ? "grayscale" : ""
  }`;

  if (launcherStyle !== "orb") {
    // Same look as the classic launcher button in the widget.
    const background = body.startsWith("linear-gradient") ? body : `linear-gradient(145deg, ${body}, ${body}cc)`;
    return (
      <span aria-hidden className={ring} style={{ width: size, height: size, background }}>
        <img src={chatIcon} alt="" style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }

  // Gradients have no single eye colour; light eyes read on any of them.
  const eye = orbPropsFor(body).eyeColor ?? "#F9FCFF";
  return (
    <span aria-hidden className={`${ring} gap-[18%]`} style={{ width: size, height: size, background: body }}>
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
