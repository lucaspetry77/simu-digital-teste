"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motionTokens } from "@/components/arc/lib/motion-tokens";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { PlayIcon } from "@/components/icons/play";
import { SlidersHorizontalIcon } from "@/components/icons/sliders-horizontal";
import { AnimIcon, HoverScope, useHover } from "@/components/ui/anim-icon";
import { AreaIcons } from "@/components/ui/area-icon";
import { Button } from "@/components/ui/button";
import { presetAreas } from "@/lib/simulado";
import { createAttempt, QUICK_STARTS } from "@/lib/start";

function useStart() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return [
    pending,
    (key: string) =>
      start(async () => {
        const preset = QUICK_STARTS.find((q) => q.key === key)!;
        const a = await createAttempt(preset.config);
        router.push(`/prova?id=${a.id}`);
      }),
  ] as const;
}

export function QuickStartButton({
  presetKey,
  children,
  variant = "secondary",
  size = "lg",
  className,
}: {
  presetKey: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ink";
  size?: "md" | "lg";
  className?: string;
}) {
  const [pending, start] = useStart();
  return (
    <Button variant={variant} size={size} className={className} loading={pending} onClick={() => start(presetKey)}>
      <AnimIcon icon={PlayIcon} size={16} />
      {children}
    </Button>
  );
}

export function QuickStartCards() {
  const [pending, start] = useStart();
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUICK_STARTS.map((q, i) => {
        // o cartão clicado mostra que está abrindo; os outros só ficam indisponíveis
        const opening = pending && chosen === q.key;
        return (
          <QuickCard
            key={q.key}
            index={i}
            disabled={pending}
            busy={opening}
            onClick={() => {
              setChosen(q.key);
              start(q.key);
            }}
          >
            <AreaIcons areas={presetAreas(q.config)} />
            <span>
              <span className="block text-[15px] font-semibold text-ink">{q.title}</span>
              <span className="mt-1 flex items-center justify-between text-[13px] text-ink-3">
                {opening ? "Abrindo a prova…" : q.detail}
                {opening ? (
                  <span aria-hidden className="size-4 animate-spin rounded-full border-[1.5px] border-ink border-r-transparent" />
                ) : (
                  <AnimIcon icon={ArrowRightIcon} size={16} className="text-ink" />
                )}
              </span>
            </span>
          </QuickCard>
        );
      })}
      <QuickCard index={3} href="/novo" dashed>
        <span className="grid size-9 place-items-center rounded-xl bg-sunken text-ink-2">
          <AnimIcon icon={SlidersHorizontalIcon} size={18} />
        </span>
        <span>
          <span className="block text-[15px] font-semibold text-ink">Do seu jeito</span>
          <span className="mt-1 flex items-center justify-between text-[13px] text-ink-3">
            Área, edição, quantidade e tempo
            <AnimIcon icon={ArrowRightIcon} size={16} className="text-ink" />
          </span>
        </span>
      </QuickCard>
    </div>
  );
}

function QuickCard({
  children,
  onClick,
  href,
  disabled,
  busy,
  dashed,
  index,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  busy?: boolean;
  dashed?: boolean;
  index: number;
}) {
  const [hovered, bind] = useHover();
  // no celular os cartões ficam empilhados: sem altura mínima e com menos respiro, para não virar uma página de cartões
  const cls = `lift flex h-full flex-col justify-between gap-4 rounded-2xl border p-5 text-left disabled:cursor-not-allowed sm:min-h-40 sm:gap-6 ${
    busy ? "disabled:cursor-progress" : "disabled:opacity-60"
  } ${
    dashed ? "border-dashed border-line-strong bg-transparent hover:bg-elev" : "border-line bg-elev shadow-sm"
  }`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...motionTokens.spring.smooth, delay: index * motionTokens.stagger.item * 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <HoverScope hovered={hovered}>
        {href ? (
          <Link href={href} className={cls} {...bind}>
            {children}
          </Link>
        ) : (
          <button type="button" onClick={onClick} disabled={disabled} aria-busy={busy || undefined} className={`${cls} w-full`} {...bind}>
            {children}
          </button>
        )}
      </HoverScope>
    </motion.div>
  );
}
