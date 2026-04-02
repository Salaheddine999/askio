import { motion } from "framer-motion";
import { useEffect, useId, useState, type RefObject, type SVGProps } from "react";

type AnimatedBeamProps = SVGProps<SVGSVGElement> & {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
};

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "#D8D1C7",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#C98B2E",
  gradientStopColor = "#5F564E",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className,
  ...props
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      };

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const from = fromRef.current;
      const to = toRef.current;

      if (!container || !from || !to) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      const width = containerRect.width;
      const height = containerRect.height;
      const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
      const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;
      const controlY = startY - curvature;

      setSvgDimensions({ width, height });
      setPathD(`M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`);
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    if (fromRef.current) observer.observe(fromRef.current);
    if (toRef.current) observer.observe(toRef.current);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  if (!pathD) {
    return null;
  }

  return (
    <svg
      className={className ?? "pointer-events-none absolute inset-0"}
      width={svgDimensions.width}
      height={svgDimensions.height}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          animate={gradientCoordinates}
          transition={{
            delay,
            duration,
            ease: [0, 0, 1, 1],
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>

      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path d={pathD} stroke={`url(#${id})`} strokeWidth={pathWidth} strokeLinecap="round" />
    </svg>
  );
}
