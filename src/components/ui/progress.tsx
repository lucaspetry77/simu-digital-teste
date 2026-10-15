import { cn } from "@/lib/cn";

export function Progress({
  value,
  className,
  color = "var(--brand)",
  label,
}: {
  value: number;
  className?: string;
  color?: string;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 overflow-hidden rounded-full bg-sunken", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${v}%`, background: color }}
      />
    </div>
  );
}
