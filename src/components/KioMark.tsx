import React from "react";

/**
 * Kio's face as a glyph: the round launcher with its two eyes cut out, so it
 * takes the text colour. For places that talk about Kio itself, like the
 * homepage pill. Drop-in for a Lucide icon (size, className; strokeWidth is
 * accepted and ignored).
 */
const KioMark = React.forwardRef<
  SVGSVGElement,
  { size?: number | string; className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }
>((props, ref) => (
  <svg
    ref={ref}
    width={props.size ?? 16}
    height={props.size ?? 16}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden={props["aria-hidden"] ?? true}
    className={props.className}
  >
    <path
      fillRule="evenodd"
      d="M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 1 0 0-19Z M9.4 8.2a1.15 1.15 0 0 1 1.15 1.15v4.3a1.15 1.15 0 0 1-2.3 0v-4.3A1.15 1.15 0 0 1 9.4 8.2Z M14.6 8.2a1.15 1.15 0 0 1 1.15 1.15v4.3a1.15 1.15 0 0 1-2.3 0v-4.3a1.15 1.15 0 0 1 1.15-1.15Z"
    />
  </svg>
));
KioMark.displayName = "KioMark";

export default KioMark;
