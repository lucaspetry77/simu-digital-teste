"use client";

import { AnimIcon, type AnimatedIcon, HoverScope, useHover } from "@/components/ui/anim-icon";
import { cn } from "@/lib/cn";

/** Cartão de recurso: o ícone se anima quando o cartão recebe hover ou foco. */
export function FeatureCard({
  icon,
  title,
  text,
  children,
  className,
}: {
  icon: AnimatedIcon;
  title: string;
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [hovered, bind] = useHover();
  return (
    <div {...bind} className={cn("lift flex flex-col rounded-3xl border border-line bg-elev p-6 shadow-sm sm:p-7", className)}>
      <HoverScope hovered={hovered}>
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-ink">
          <AnimIcon icon={icon} size={20} />
        </span>
        <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{text}</p>
        {children}
      </HoverScope>
    </div>
  );
}

export function HoverRow({
  icon,
  title,
  text,
}: {
  icon: AnimatedIcon;
  title: string;
  text: string;
}) {
  const [hovered, bind] = useHover();
  return (
    <div {...bind} className="lift flex items-start gap-4 rounded-2xl border border-line bg-elev p-5 shadow-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunken text-ink-2">
        <AnimIcon icon={icon} size={20} play={hovered} />
      </span>
      <span>
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[13.5px] text-ink-3">{text}</span>
      </span>
    </div>
  );
}
