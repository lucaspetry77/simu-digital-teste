import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-3xl border border-line bg-elev shadow-sm", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Bloco de ícone (fundo suave) usado nos cartões do SIMU. */
export function IconTile({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "warn" | "ok";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl",
        tone === "brand" && "bg-brand-soft text-brand-ink",
        tone === "neutral" && "bg-sunken text-ink-2",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "ok" && "bg-ok-soft text-ok",
        className,
      )}
    >
      {children}
    </span>
  );
}
