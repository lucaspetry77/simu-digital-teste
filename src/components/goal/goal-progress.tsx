"use client";

import Link from "next/link";
import { PenLine, TrendingUp, TriangleAlert } from "lucide-react";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { CompassIcon } from "@/components/icons/compass";
import { AnimIcon, AnimIconOnMount } from "@/components/ui/anim-icon";
import { AreaIcon } from "@/components/ui/area-icon";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AREA_META, AREAS, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { modalityShortLabel, type Percentiles } from "@/lib/data";
import { fmtScore } from "@/lib/format";
import { projectGoal, type ScoreProfile } from "@/lib/simulado";
import type { Goal } from "@/lib/store";

const LABEL: Record<Area | "RE", string> = { ...Object.fromEntries(AREAS.map((a) => [a, AREA_META[a].short])), RE: "Redação" } as Record<
  Area | "RE",
  string
>;

export function GoalProgress({
  goal,
  profile,
  pct,
  focusArea,
}: {
  goal: Goal;
  profile: ScoreProfile;
  pct: Percentiles | null;
  focusArea?: Area;
}) {
  const p = projectGoal(goal, profile, pct);
  const reached = p.gap != null && p.gap >= 0;
  const lo = 450;
  const hi = 1000;
  const posOf = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
  const top = p.leverage[0];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
            <AnimIconOnMount icon={CompassIcon} size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-ink-3">Sua meta · SISU 2026</p>
            <p className="truncate text-[16px] font-semibold tracking-tight text-ink">
              {goal.name} · {goal.acronym}
            </p>
            <p className="truncate text-[12.5px] text-ink-3">
              {goal.city}/{goal.state} · {goal.shift} · {modalityShortLabel(goal.modality.code, goal.modality.label)}
            </p>
          </div>
        </div>
        <Link href="/meta" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-3 hover:text-ink">
          <PenLine className="size-3.5" /> Alterar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 py-6 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[12px] text-ink-3">Sua média projetada</p>
              <p className="text-[44px] leading-none font-semibold tracking-[-0.05em] text-ink tabular">{fmtScore(p.mean)}</p>
            </div>
            <div className="pb-1">
              <p className="text-[12px] text-ink-3">Nota de corte</p>
              <p className="text-[18px] font-semibold text-ink tabular">
                {p.cutoff != null ? fmtScore(p.cutoff) : "–"}
              </p>
            </div>
          </div>
          {p.gap != null ? (
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium",
                reached ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn",
              )}
            >
              <TrendingUp className="size-3.5" />
              {reached ? `${fmtScore(p.gap)} pontos acima do corte` : `Faltam ${fmtScore(-p.gap)} pontos na média`}
            </p>
          ) : null}

          {/* trilho */}
          <div className="relative mt-7 h-2 rounded-full bg-sunken">
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full", reached ? "bg-ok" : "bg-brand")}
              style={{ width: posOf(p.mean) }}
            />
            {p.cutoff != null ? (
              <div className="absolute -top-2 -bottom-2 w-0.5 bg-ink" style={{ left: posOf(p.cutoff) }}>
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap text-ink-3">corte</span>
              </div>
            ) : null}
          </div>

          {top ? (
            <p className="mt-9 text-[13px] leading-relaxed text-ink-2">
              <strong className="font-medium text-ink">Onde cada ponto vale mais:</strong> 10 pontos a mais em{" "}
              {LABEL[top.area]} somam <strong className="font-medium text-ink">+{fmtScore(top.per10)}</strong> na sua média
              {p.leverage.at(-1) && p.leverage.at(-1)!.per10 < top.per10
                ? `, ${(top.per10 / p.leverage.at(-1)!.per10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}× o efeito em ${LABEL[p.leverage.at(-1)!.area]}.`
                : "."}
            </p>
          ) : null}
        </div>

        <ul className="space-y-2">
          {(["LC", "CH", "CN", "MT", "RE"] as const).map((k) => {
            const isArea = k !== "RE";
            const have = isArea ? profile[k as Area] : true;
            const w = goal.weights[k] ?? 1;
            const below = p.belowMinimum.includes(k);
            return (
              <li
                key={k}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                  focusArea === k ? "border-ink/40 bg-elev" : "border-line",
                )}
              >
                {isArea ? (
                  <AreaIcon area={k as Area} size="sm" />
                ) : (
                  <span className="grid size-6 place-items-center rounded-md bg-sunken text-[10px] font-medium text-ink-3">RD</span>
                )}
                <span className="flex-1 text-[13px] text-ink-2">{LABEL[k]}</span>
                <span className="rounded-md bg-sunken px-1.5 py-0.5 text-[11px] text-ink-3">peso {w.toLocaleString("pt-BR")}</span>
                <span className={cn("w-16 text-right text-[13px] tabular", have ? "text-ink" : "text-ink-3 italic")}>
                  {fmtScore(p.scores[k])}
                </span>
                {/* espaço do alerta reservado em todas as linhas, para as notas ficarem numa coluna só */}
                {p.belowMinimum.length ? (
                  <span className="w-3.5 shrink-0">
                    {below ? <TriangleAlert className="size-3.5 text-bad" aria-label="Abaixo da nota mínima do curso" /> : null}
                  </span>
                ) : null}
              </li>
            );
          })}
          {p.missing.length ? (
            <li className="px-1 pt-1 text-[12px] leading-relaxed text-ink-3">
              Em itálico: áreas ainda sem simulado, preenchidas com a média nacional. Redação: {fmtScore(goal.redacao)}{" "}
              (sua estimativa).
            </li>
          ) : (
            <li className="px-1 pt-1 text-[12px] text-ink-3">Redação: {fmtScore(goal.redacao)} (sua estimativa).</li>
          )}
        </ul>
      </div>
    </Card>
  );
}

export function GoalEmpty({ compact }: { compact?: boolean }) {
  return (
    <Card className={cn("flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6", compact && "sm:flex-col sm:items-start")}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
        <AnimIconOnMount icon={CompassIcon} size={22} />
      </span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-ink">Para onde você quer ir?</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">
          Escolha um curso entre as 7.390 ofertas do SISU 2026. A cada simulado você vê quanto falta e em qual área
          cada ponto vale mais para essa vaga.
        </p>
      </div>
      <ButtonLink href="/meta" variant="soft" className="shrink-0">
        Definir minha meta
        <AnimIcon icon={ArrowRightIcon} size={16} />
      </ButtonLink>
    </Card>
  );
}
