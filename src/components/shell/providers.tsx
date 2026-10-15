"use client";

import { MotionConfig } from "motion/react";

/** Toda animação respeita a preferência de movimento reduzido do sistema. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
