import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-into-view reveal. Wrap a section to fade + rise its children once,
 * when they enter the viewport. Use `RevealItem` inside a `Reveal` with
 * `stagger` for a cascading list.
 */
interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger child <RevealItem> entrances by this many seconds. */
  stagger?: number;
  delay?: number;
  /** Render as a different element if needed. */
  as?: "div" | "section" | "ul" | "header";
}

export function Reveal({ children, className, stagger = 0, delay = 0, as = "div" }: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </MotionTag>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag className={className} variants={itemVariants}>
      {children}
    </MotionTag>
  );
}
