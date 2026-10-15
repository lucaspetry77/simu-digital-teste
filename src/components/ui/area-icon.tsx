"use client";

import { ChartSplineIcon } from "@/components/icons/chart-spline";
import { EarthIcon } from "@/components/icons/earth";
import { FlaskIcon } from "@/components/icons/flask";
import { LanguagesIcon } from "@/components/icons/languages";
import { AREA_META, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { AnimIcon, type AnimatedIcon } from "./anim-icon";

const ICONS: Record<Area, AnimatedIcon> = {
  LC: LanguagesIcon,
  CH: EarthIcon,
  CN: FlaskIcon,
  MT: ChartSplineIcon,
};
const TILE = { sm: "size-6 rounded-md", md: "size-9 rounded-xl", lg: "size-11 rounded-2xl" } as const;
const GLYPH = { sm: 14, md: 18, lg: 21 } as const;

/** Ícone animado da área num bloco na cor da área. Anima com o hover do pai ou com `play`. */
export function AreaIcon({
  area,
  size = "md",
  play,
  className,
}: {
  area: Area;
  size?: "sm" | "md" | "lg";
  play?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center", TILE[size], className)}
      style={{ background: AREA_META[area].soft, color: AREA_META[area].color }}
    >
      <AnimIcon icon={ICONS[area]} size={GLYPH[size]} play={play} />
    </span>
  );
}

export function AreaIcons({
  areas,
  size = "md",
  play,
  className,
}: {
  areas: Area[];
  size?: "sm" | "md" | "lg";
  play?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {areas.map((a) => (
        <AreaIcon key={a} area={a} size={size} play={play} />
      ))}
    </span>
  );
}

export function AreaDot({ area, className }: { area: Area; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: AREA_META[area].color }}
    />
  );
}

/** Só o ícone animado, na cor da área (para slots pequenos, ex.: RadioCards do Arc). */
export function AreaGlyph({ area, size = 18, play }: { area: Area; size?: number; play?: boolean }) {
  return (
    <span aria-hidden className="inline-flex" style={{ color: AREA_META[area].color }}>
      <AnimIcon icon={ICONS[area]} size={size} play={play} />
    </span>
  );
}
