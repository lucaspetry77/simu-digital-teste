"use client";

import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { cn } from "@/lib/cn";

/** Adaptador do SegmentedControl do Arc (destaque que desliza entre opções), em pílula como os botões. */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <SegmentedControl
      label={label}
      className={cn("[--radius-control:var(--radius-pill)]", className)}
      value={String(value)}
      onValueChange={(v: string) => {
        const found = options.find((o) => String(o.value) === v);
        if (found) onChange(found.value);
      }}
      options={options.map((o) => ({
        value: String(o.value),
        label: o.label,
        accessory: o.hint ? <span className="text-[11px] font-normal text-ink-3 tabular">{o.hint}</span> : undefined,
      }))}
    />
  );
}
