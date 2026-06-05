import type { Transition, Variants } from "motion/react";

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const quickTransition: Transition = { duration: 0.18, ease: easeOut };
export const mediumTransition: Transition = { duration: 0.22, ease: easeOut };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: quickTransition },
};

export const fadeUpStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: quickTransition },
};

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: quickTransition },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12, ease: "easeIn" } },
};

export const scaleTap = { whileTap: { scale: 0.97 } };

export const iconHover = {
  whileHover: { scale: 1.08 },
  transition: { type: "spring", stiffness: 500, damping: 22 },
};

export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 32,
};

const snappySpring = { type: "spring", stiffness: 520, damping: 28 } as const;
const buttonSpring = { type: "spring", stiffness: 500, damping: 30 } as const;

export const buttonPress = {
  whileHover: { scale: 1.02, transition: buttonSpring },
  whileTap: { scale: 0.98, transition: buttonSpring },
};

export const cardLiftHover = {
  whileHover: { y: -4, transition: snappySpring },
};

export const cardLiftHoverStrong = {
  whileHover: {
    y: -5,
    boxShadow: "0 16px 32px rgba(15,23,42,0.1)",
    transition: snappySpring,
  },
};

export const iconWiggleHover = {
  whileHover: { scale: 1.1, rotate: 5, transition: { type: "spring", stiffness: 520, damping: 22 } },
};

export const primaryButtonHover = {
  whileHover: {
    scale: 1.02,
    boxShadow: "0 16px 32px rgba(37,99,235,0.28)",
    transition: buttonSpring,
  },
  whileTap: { scale: 0.98, transition: buttonSpring },
};

export const floatBadge = (distance = 4, durationSec = 1.1, delaySec = 0) => ({
  animate: { y: [0, -distance, 0], opacity: [1, 0.92, 1] },
  transition: { duration: durationSec, repeat: Infinity, ease: "easeInOut", delay: delaySec },
});

export const sectionGradientShift = {
  animate: { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] },
  transition: { duration: 5, repeat: Infinity, ease: "linear" },
};

export const gradientShineClass =
  "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-300 group-hover:translate-x-full";

export const navUnderlineClass =
  "absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-150 group-hover:w-full";

export function reducedMotionSafe(
  reduced: boolean,
  value: number,
  fallback = 0
): number {
  return reduced ? fallback : value;
}

export function staggerDelay(index: number, reduced: boolean, step = 0.05): number {
  return reduced ? 0 : index * step;
}
