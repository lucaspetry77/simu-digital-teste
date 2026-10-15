"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Ícones animados (lucide-animated) disparados pelo elemento pai: passe o mouse
 * num botão ou cartão e o ícone dentro dele se move. Cada animação explica a
 * ação (a seta avança, o relógio gira, o check se desenha).
 */
type IconHandle = { startAnimation: () => void; stopAnimation: () => void };
export type AnimatedIcon = ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & { size?: number } & RefAttributes<IconHandle>
>;

const HoverContext = createContext(false);

export function useHover() {
  const [hovered, setHovered] = useState(false);
  const on = useCallback(() => setHovered(true), []);
  const off = useCallback(() => setHovered(false), []);
  return [hovered, { onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off }] as const;
}

export function HoverScope({ hovered, children }: { hovered: boolean; children: React.ReactNode }) {
  return <HoverContext.Provider value={hovered}>{children}</HoverContext.Provider>;
}

export function AnimIcon({
  icon: Icon,
  size = 18,
  play,
  className,
}: {
  icon: AnimatedIcon;
  size?: number;
  /** força a animação (ex.: ao selecionar); sem isso, segue o hover do pai */
  play?: boolean;
  className?: string;
}) {
  const parentHover = useContext(HoverContext);
  const active = play ?? parentHover;
  const ref = useRef<IconHandle>(null);
  useEffect(() => {
    if (active) ref.current?.startAnimation();
    else ref.current?.stopAnimation();
  }, [active]);
  return (
    <Icon
      ref={ref}
      size={size}
      aria-hidden
      className={cn("pointer-events-none inline-flex w-fit shrink-0 items-center justify-center", className)}
    />
  );
}

/** Dispara a animação uma vez quando o componente aparece (ex.: check no resultado). */
export function AnimIconOnMount({ icon, size, className, delay = 250 }: { icon: AnimatedIcon; size?: number; className?: string; delay?: number }) {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPlay(true), delay);
    const t2 = setTimeout(() => setPlay(false), delay + 1200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [delay]);
  return <AnimIcon icon={icon} size={size} className={className} play={play} />;
}
