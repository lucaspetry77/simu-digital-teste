"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ComponentProps, CSSProperties } from "react";
import { Button as ArcButton } from "@/components/arc/button/button";
import { cn } from "@/lib/cn";
import { HoverScope, useHover } from "./anim-icon";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "ink";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const ARC_VARIANT = { primary: "primary", ink: "primary", secondary: "secondary", soft: "secondary", ghost: "ghost", danger: "danger" } as const;
const ARC_SIZE = { sm: "sm", md: "md", lg: "lg", icon: "md", "icon-sm": "sm" } as const;

/* O primário do Arc pinta com --foreground/--background; trocando essas
   variáveis só no próprio botão ele assume o azul do SIMU. */
const BRAND: CSSProperties = { ["--foreground" as string]: "var(--brand)", ["--background" as string]: "#fff" };
const SOFT: CSSProperties = {
  ["--surface" as string]: "var(--brand-soft)",
  ["--border" as string]: "transparent",
  ["--foreground" as string]: "var(--brand-ink)",
};
/* Botões em pílula: o Arc arredonda pelo --radius-control, que os outros controles também usam. */
const PILL: CSSProperties = { ["--radius-control" as string]: "var(--radius-pill)" };

/**
 * Botão da biblioteca Arc UI (pressão com mola, rótulo que morfa ao mudar) com
 * as cores do SIMU e um escopo de hover para os ícones animados dentro dele.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: Omit<ComponentProps<typeof ArcButton>, "variant" | "size"> & { variant?: Variant; size?: Size }) {
  const [hovered, bind] = useHover();
  return (
    <ArcButton
      variant={ARC_VARIANT[variant]}
      size={ARC_SIZE[size]}
      className={cn("[&_svg]:size-4", variant === "primary" && "shadow-[0_1px_0_rgb(0_0_0/0.12),0_2px_6px_-2px_color-mix(in_oklab,var(--brand)_60%,transparent)]", className)}
      style={{ ...PILL, ...(variant === "primary" ? BRAND : variant === "soft" ? SOFT : null), ...style }}
      onMouseEnter={(e) => {
        bind.onMouseEnter();
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        bind.onMouseLeave();
        onMouseLeave?.(e);
      }}
      {...props}
    >
      <HoverScope hovered={hovered}>{children}</HoverScope>
    </ArcButton>
  );
}

/* Links com a mesma aparência dos botões */
const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,border-color,opacity] duration-150 [&_svg]:shrink-0";
const linkVariants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_0_rgb(0_0_0/0.12),0_2px_6px_-2px_color-mix(in_oklab,var(--brand)_60%,transparent)] hover:bg-brand-hover",
  ink: "bg-ink text-inverse shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.2)] hover:opacity-90",
  secondary: "border border-line bg-elev text-ink shadow-sm hover:border-line-strong hover:bg-hover",
  ghost: "text-ink-2 hover:bg-hover hover:text-ink",
  soft: "bg-brand-soft text-brand-ink hover:bg-[color-mix(in_oklab,var(--brand-soft)_80%,var(--brand)_10%)]",
  danger: "border border-line bg-elev text-bad hover:border-bad/40 hover:bg-bad-soft",
};
const linkSizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] [&_svg]:size-3.5",
  md: "h-11 px-4 text-sm [&_svg]:size-4",
  lg: "h-12 px-5 text-[15px] [&_svg]:size-[18px]",
  icon: "size-11 [&_svg]:size-[18px]",
  "icon-sm": "size-9 [&_svg]:size-4",
};

const MotionLink = motion.create(Link);

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  const [hovered, bind] = useHover();
  return (
    <MotionLink
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", visualDuration: 0.26, bounce: 0.12 }}
      className={cn(base, linkVariants[variant], linkSizes[size], className)}
      {...bind}
      {...(props as object)}
    >
      <HoverScope hovered={hovered}>{children}</HoverScope>
    </MotionLink>
  );
}

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, linkVariants[variant], linkSizes[size], className);
}
