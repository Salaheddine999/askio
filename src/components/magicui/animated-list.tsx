"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
};

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.14,
            delayChildren: 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

