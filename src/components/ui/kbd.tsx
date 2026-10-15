import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line border-b-2 bg-elev px-1 font-mono text-[11px] font-medium text-ink-3",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
