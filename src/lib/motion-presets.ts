import type { Transition, Variants } from "motion/react";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

export const scaleTap = { whileTap: { scale: 0.97 } };

export const iconHover = { whileHover: { scale: 1.08 }, transition: { type: "spring", stiffness: 400, damping: 17 } };

export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

export function reducedMotionSafe(
  reduced: boolean,
  value: number,
  fallback = 0
): number {
  return reduced ? fallback : value;
}

export function staggerDelay(index: number, reduced: boolean, step = 0.08): number {
  return reduced ? 0 : index * step;
}
