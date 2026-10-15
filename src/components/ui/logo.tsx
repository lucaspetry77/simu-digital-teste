import { cn } from "@/lib/cn";

/** Marca: uma bolinha do cartão-resposta preenchida. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="2" />
      <circle cx="16" cy="16" r="5.5" fill="white" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {!compact ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">simu</span>
          <span className="rounded-md bg-sunken px-1.5 py-px text-[10px] font-semibold tracking-wider text-ink-3">ENEM</span>
        </span>
      ) : null}
    </span>
  );
}
