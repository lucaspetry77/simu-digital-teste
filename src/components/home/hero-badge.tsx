"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { AnimIcon, HoverScope, useHover } from "@/components/ui/anim-icon";
import { BrowserOnly } from "@/components/ui/browser-only";
import { cn } from "@/lib/cn";
import { useAttempts } from "@/lib/store";

const pill = "mx-auto inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium shadow-sm";

/**
 * Selo acima do título do hero. Com uma prova em andamento, ele vira o atalho para continuar.
 * Ocupa sempre a mesma altura: a antiga faixa "Prova em andamento" só aparecia depois de ler o
 * navegador e empurrava o hero inteiro ~95px para baixo no meio da leitura.
 */
export function HeroBadge() {
  return (
    <BrowserOnly fallback={<FreeBadge />}>
      <HeroBadgeInner />
    </BrowserOnly>
  );
}

function FreeBadge() {
  return (
    <p className={cn(pill, "border-line bg-elev text-ink-2")}>
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
        <span className="relative size-1.5 rounded-full bg-ok" />
      </span>
      Gratuito, sem cadastro e sem coletar seus dados
    </p>
  );
}

function HeroBadgeInner() {
  const attempts = useAttempts();
  const [hovered, bind] = useHover();
  const active = attempts.find((a) => a.status === "active");
  if (!active) return <FreeBadge />;
  const answered = Object.values(active.answers).filter((a) => a.choice).length;
  return (
    <Link
      href={`/prova?id=${active.id}`}
      {...bind}
      className={cn(pill, "border-brand/30 bg-brand-softer text-brand-ink transition-colors hover:border-brand/50")}
    >
      <HoverScope hovered={hovered}>
        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
        <span className="truncate">
          Continuar a prova: {active.title} · {answered}/{active.items.length}
        </span>
        <AnimIcon icon={ArrowRightIcon} size={14} />
      </HoverScope>
    </Link>
  );
}
