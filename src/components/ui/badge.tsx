import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "ok" | "bad" | "warn" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  brand: "bg-brand-soft text-brand-ink",
  ok: "bg-ok-soft text-ok",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  outline: "border border-line text-ink-2",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
