"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, Trash2, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { BookTextIcon } from "@/components/icons/book-text";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { CompassIcon } from "@/components/icons/compass";
import { DownloadIcon } from "@/components/icons/download";
import { PlayIcon } from "@/components/icons/play";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { SparklesIcon } from "@/components/icons/sparkles";
import { UploadIcon } from "@/components/icons/upload";
import { AnimIcon, AnimIconOnMount, HoverScope, useHover } from "@/components/ui/anim-icon";
import { CountUp } from "@/components/results/score-hero";
import { Suspense, use, useMemo, useRef, useState, useTransition } from "react";
import { GoalEmpty } from "@/components/goal/goal-progress";
import { AreaIcon, AreaIcons } from "@/components/ui/area-icon";
import { Badge } from "@/components/ui/badge";
import { BrowserOnly, Skeleton } from "@/components/ui/browser-only";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, IconTile } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AREA_META, AREAS, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { loadPercentiles, modalityShortLabel, type Percentiles } from "@/lib/data";
import { fmtDate, fmtDuration, fmtInt, fmtScore, plural } from "@/lib/format";
import {
  areaHistory,
  type Focus,
  meanTrajectory,
  type NotebookEntry,
  notebookEntries,
  plainMean,
  presetAreas,
  projectGoal,
  type ScoreProfile,
  scoreProfile,
  studyFocus,
  suggestedMinutes,
  type TrajectoryPoint,
} from "@/lib/simulado";
import { createAttempt } from "@/lib/start";
import {
  type Attempt,
  clearAll,
  exportBackup,
  type Goal,
  importBackup,
  useAttempts,
  useGoal,
  useNotebookState,
} from "@/lib/store";
import { QuickStartCards } from "./quick-start";
import { TrajectoryChart } from "./trajectory-chart";

/* O painel responde, nesta ordem, o que quem estuda quer saber:
   1. tem prova pela metade? → continuar
   2. estou chegando na vaga? → distância até o corte e a tendência
   3. o que faço agora? → um próximo passo, na área onde o ponto vale mais
   4. como está cada área? → nota, tendência e peso
   5. o que já fiz → histórico e dados */

export function Dashboard() {
  return (
    <BrowserOnly fallback={<DashboardSkeleton />} reason="O painel lê o histórico salvo neste navegador.">
      <DashboardInner />
    </BrowserOnly>
  );
}

function DashboardInner() {
  const attempts = useAttempts();
  const goal = useGoal();
  const done = attempts.filter((a) => a.status === "done" && a.result);
  const active = attempts.filter((a) => a.status === "active");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] text-ink">
            {done.length ? "Como você está indo" : "Bem-vindo ao SIMU"}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-ink-3">
            <AnimIconOnMount icon={ShieldCheckIcon} size={16} className="text-ok" /> Tudo aqui fica salvo só neste
            navegador. Sem conta, sem coleta.
          </p>
        </div>
        {done.length ? (
          // no celular o menu já leva ao /novo; aqui a linha inteira empurraria a meta para baixo
          <ButtonLink href="/novo" variant="secondary" className="hidden sm:inline-flex">
            Montar simulado
            <AnimIcon icon={ArrowRightIcon} size={16} />
          </ButtonLink>
        ) : null}
      </header>

      {active.length ? (
        <div className="mt-8 space-y-3">
          {active.map((a) => (
            <ActiveCard key={a.id} attempt={a} />
          ))}
        </div>
      ) : null}

      {!done.length ? (
        <div className="mt-10 space-y-6">
          <Card className="p-6 sm:p-8">
            <p className="text-[17px] font-semibold text-ink">Comece pelo primeiro simulado</p>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-3">
              Depois dele, este painel mostra quanto falta para a sua meta, onde cada ponto vale mais e um caderno
              com tudo o que vale revisar.
            </p>
            <div className="mt-6">
              <QuickStartCards />
            </div>
          </Card>
          <GoalEmpty />
        </div>
      ) : (
        <Suspense fallback={<OverviewSkeleton />}>
          <Overview attempts={attempts} goal={goal} done={done} />
        </Suspense>
      )}

      <DataCard hasData={attempts.length > 0} />
    </div>
  );
}

function Overview({ attempts, goal, done }: { attempts: Attempt[]; goal: Goal | null; done: Attempt[] }) {
  const pct = use(loadPercentiles());
  const nbState = useNotebookState();
  const profile = useMemo(() => scoreProfile(attempts), [attempts]);
  const trajectory = useMemo(() => meanTrajectory(attempts, goal, pct), [attempts, goal, pct]);
  const history = useMemo(() => areaHistory(attempts), [attempts]);
  const pending = useMemo(() => notebookEntries(attempts, nbState).filter((e) => !e.resolvedAt), [attempts, nbState]);
  const focus = studyFocus(goal, profile, pct);
  // o treino sugerido usa a língua estrangeira do último simulado
  const language = attempts[0]?.config.language ?? "ingles";

  return (
    <>
      <section className="mt-8 animate-fade-up" aria-label="Sua meta">
        {goal ? (
          <GoalHero goal={goal} profile={profile} pct={pct} trajectory={trajectory} />
        ) : (
          <PlainHero profile={profile} trajectory={trajectory} />
        )}
      </section>

      <section
        className="mt-4 grid animate-fade-up grid-cols-1 gap-4 [animation-delay:80ms] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
        aria-label="O que fazer agora"
      >
        <NextStep focus={focus} goal={goal} profile={profile} pct={pct} pending={pending} language={language} />
        <NotebookCard pending={pending} focus={focus.area} />
      </section>

      <section className="mt-12 animate-fade-up [animation-delay:160ms]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight text-ink">Suas notas por área</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              Última nota TRI de cada área. A seta compara com a primeira vez que você fez a área.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {AREAS.map((a) => (
            <AreaTile
              key={a}
              area={a}
              points={history[a]}
              weight={goal?.weights[a]}
              minimum={goal && goal.minimumScores[a] > 1 ? goal.minimumScores[a] : null}
              focus={focus.area === a}
              national={pct.areas[a].mean}
              language={language}
            />
          ))}
          {goal ? <RedacaoTile goal={goal} /> : <GoalTile />}
        </div>
      </section>

      <HistoryCard done={done} />
    </>
  );
}

/* ── Meta ───────────────────────────────────────────────────────────────── */

function GoalHero({
  goal,
  profile,
  pct,
  trajectory,
}: {
  goal: Goal;
  profile: ScoreProfile;
  pct: Percentiles;
  trajectory: TrajectoryPoint[];
}) {
  const p = projectGoal(goal, profile, pct);
  const reached = p.gap != null && p.gap >= 0;
  const LABEL = (k: Area | "RE") => (k === "RE" ? "Redação" : AREA_META[k].short);

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <IconTile>
                <AnimIconOnMount icon={CompassIcon} size={20} />
              </IconTile>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-ink-3">Sua meta · SISU 2026</p>
                <p className="text-[15px] leading-snug font-semibold tracking-tight text-pretty text-ink">
                  {goal.name} · {goal.acronym}
                </p>
                <p className="text-[12.5px] text-ink-3">
                  {goal.city}/{goal.state} · {modalityShortLabel(goal.modality.code, goal.modality.label)}
                </p>
              </div>
            </div>
            <Link
              href="/meta"
              className="-mr-2 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-[12.5px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            >
              <PenLine className="size-3.5" /> Alterar
            </Link>
          </div>

          <div className="mt-8 sm:mt-10">
            {p.gap == null ? (
              <>
                <p className="text-[15px] text-ink-2">Sua média projetada</p>
                <p className="mt-1 text-[56px] leading-none font-semibold tracking-[-0.05em] text-ink">
                  <CountUp value={p.mean} />
                </p>
                <p className="mt-3 text-[13.5px] text-ink-3">Essa modalidade não teve nota de corte no SISU 2026.</p>
              </>
            ) : (
              <>
                <p className={cn("text-[15px] font-medium", reached ? "text-ok" : "text-ink-2")}>
                  {reached ? "Com as notas de hoje, você passaria" : "Para a sua vaga, faltam"}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-ink">
                  <span className="text-[56px] leading-none font-semibold tracking-[-0.05em]">
                    {reached ? "+" : ""}
                    <CountUp value={Math.abs(p.gap)} />
                  </span>
                  <span className="text-[17px] font-medium text-ink-2">{reached ? "pontos acima do corte" : "pontos"}</span>
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">
                  Média ponderada projetada <span className="font-medium text-ink tabular">{fmtScore(p.mean)}</span> · nota de
                  corte <span className="font-medium text-ink tabular">{fmtScore(p.cutoff!)}</span>
                </p>
              </>
            )}
            <TrendChip trajectory={trajectory} className="mt-4" />
          </div>

          {p.belowMinimum.length || p.missing.length ? (
            <ul className="mt-auto space-y-1.5 pt-6 text-[12.5px] leading-relaxed">
              {p.belowMinimum.length ? (
                <li className="flex gap-1.5 text-bad">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  Abaixo da nota mínima do curso em {p.belowMinimum.map(LABEL).join(", ")}.
                </li>
              ) : null}
              {p.missing.length ? (
                <li className="text-ink-3">
                  Sem simulado ainda em {p.missing.map(LABEL).join(", ")}: a projeção usa a média nacional nessa
                  {p.missing.length > 1 ? "s áreas" : " área"}.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className="border-t border-line bg-sunken/50 px-4 pt-5 pb-4 sm:px-6 md:border-t-0 md:border-l">
          <p className="text-[12.5px] font-medium text-ink-2">Sua média ponderada a cada simulado</p>
          <div className="mt-3">
            <TrajectoryChart points={trajectory} cutoff={p.cutoff} reached={reached} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Sem meta: a média simples das áreas e o convite para escolher o curso. */
function PlainHero({ profile, trajectory }: { profile: ScoreProfile; trajectory: TrajectoryPoint[] }) {
  const mean = plainMean(profile);
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col p-5 sm:p-7">
          <p className="text-[15px] text-ink-2">Sua média nas áreas que você já fez</p>
          <p className="mt-1 text-[56px] leading-none font-semibold tracking-[-0.05em] text-ink">
            {mean != null ? <CountUp value={mean} /> : "–"}
          </p>
          <TrendChip trajectory={trajectory} className="mt-4" />
          <div className="mt-8 rounded-2xl bg-brand-softer p-4">
            <p className="text-[14px] font-semibold text-ink">Quanto falta para a sua vaga?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
              Escolha o curso no SISU e o painel passa a mostrar a distância até a nota de corte, com os pesos de cada
              área.
            </p>
            <ButtonLink href="/meta" variant="soft" size="sm" className="mt-3">
              Definir minha meta
              <AnimIcon icon={ArrowRightIcon} size={15} />
            </ButtonLink>
          </div>
        </div>
        <div className="border-t border-line bg-sunken/50 px-4 pt-5 pb-4 sm:px-6 md:border-t-0 md:border-l">
          <p className="text-[12.5px] font-medium text-ink-2">Sua média a cada simulado</p>
          <div className="mt-3">
            {trajectory.length ? (
              <TrajectoryChart points={trajectory} cutoff={null} reached={false} />
            ) : (
              <p className="grid h-[188px] place-items-center text-center text-[13px] text-ink-3">
                Aparece depois de um simulado com 5 ou mais questões de uma área.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TrendChip({ trajectory, className }: { trajectory: TrajectoryPoint[]; className?: string }) {
  if (trajectory.length < 2) return null;
  const d = trajectory.at(-1)!.mean - trajectory[0].mean;
  const tone = d >= 0.5 ? "ok" : d <= -0.5 ? "bad" : "neutral";
  const Icon = d <= -0.5 ? TrendingDown : TrendingUp;
  return (
    <p className={className}>
      <Badge tone={tone}>
        <Icon />
        {tone === "neutral" ? "Estável" : `${d > 0 ? "+" : "−"}${fmtScore(Math.abs(d))}`} desde o 1º simulado
      </Badge>
    </p>
  );
}

/* ── Próximo passo ──────────────────────────────────────────────────────── */

function NextStep({
  focus,
  goal,
  profile,
  pct,
  pending,
  language,
}: {
  focus: Focus;
  goal: Goal | null;
  profile: ScoreProfile;
  pct: Percentiles;
  pending: NotebookEntry[];
  language: "ingles" | "espanhol";
}) {
  const { area, reason } = focus;
  const name = AREA_META[area].short;
  const score = profile[area]?.score;
  const errors = pending.filter((e) => e.area === area).slice(0, 10);

  let title: string;
  let why: React.ReactNode;
  if (reason === "missing") {
    title = `Faça seu primeiro simulado de ${name}`;
    why = goal ? (
      <>
        Sem ele, a projeção usa a média nacional ({fmtInt(pct.areas[area].mean)}) nessa área, e a distância até o corte
        pode estar longe da real.
      </>
    ) : (
      <>Assim a sua média passa a considerar as quatro áreas.</>
    );
  } else if (reason === "minimum") {
    title = `Suba ${name} acima da nota mínima`;
    why = (
      <>
        O curso exige pelo menos <Strong>{fmtInt(goal!.minimumScores[area])}</Strong> em {name}, e sua última nota foi{" "}
        <Strong>{fmtInt(score!)}</Strong>. Abaixo disso você não concorre à vaga, mesmo com média alta.
      </>
    );
  } else if (reason === "weight") {
    const p = projectGoal(goal!, profile, pct);
    const mine = p.leverage.find((l) => l.area === area)!;
    const least = p.leverage.at(-1)!;
    const leastName = least.area === "RE" ? "Redação" : AREA_META[least.area].short;
    title = `Foque em ${name}`;
    why = (
      <>
        No seu curso, {name} tem peso <Strong>{goal!.weights[area].toLocaleString("pt-BR")}</Strong>: cada 10 pontos aqui
        somam <Strong>+{fmtScore(mine.per10)}</Strong> na média
        {least.per10 < mine.per10
          ? `, ${(mine.per10 / least.per10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}× o efeito de ${leastName}.`
          : "."}
      </>
    );
  } else {
    title = `Foque em ${name}`;
    why = (
      <>
        É a sua menor nota hoje (<Strong>{fmtInt(score!)}</Strong>), a área com mais espaço para
        {goal ? " puxar a sua média para cima." : " crescer."}
      </>
    );
  }

  return (
    <Card className="relative flex flex-col overflow-hidden p-5 sm:p-7">
      {/* um toque da cor da área, para ligar este cartão ao cartão da área lá embaixo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full opacity-60 blur-3xl"
        style={{ background: AREA_META[area].soft }}
      />
      <div className="relative flex items-center gap-2">
        <Badge tone="brand">
          <AnimIconOnMount icon={SparklesIcon} size={14} /> Seu próximo passo
        </Badge>
      </div>
      <div className="relative mt-5 flex items-start gap-4">
        <AreaIcon area={area} size="lg" play />
        <div className="min-w-0">
          <h2 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">{title}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-2">{why}</p>
        </div>
      </div>
      <StepFacts focus={focus} goal={goal} profile={profile} pct={pct} pendingInArea={pending.filter((e) => e.area === area).length} />
      <div className="relative mt-6 flex flex-wrap gap-2 sm:mt-auto sm:pt-6">
        <StartAreaButton area={area} language={language} className="w-full sm:w-auto">
          {reason === "missing" ? "Fazer" : "Treinar"} {name} · 15 questões
        </StartAreaButton>
        {errors.length ? (
          <RedoButton
            items={errors}
            variant="secondary"
            label={`Refazer ${errors.length} do caderno`}
            className="w-full sm:w-auto"
          />
        ) : null}
      </div>
    </Card>
  );
}

/** Três números que tornam o próximo passo concreto: onde você está, quanto pesa e o que muda. */
function StepFacts({
  focus,
  goal,
  profile,
  pct,
  pendingInArea,
}: {
  focus: Focus;
  goal: Goal | null;
  profile: ScoreProfile;
  pct: Percentiles;
  pendingInArea: number;
}) {
  const { area } = focus;
  const now = profile[area];
  const facts: { label: string; value: string; hint?: string; tone?: "ok" }[] = [];
  facts.push(
    now
      ? { label: "Sua última nota", value: fmtInt(now.score), hint: fmtDate(now.at).toLowerCase() }
      : { label: "Média nacional", value: fmtInt(pct.areas[area].mean), hint: "usada na projeção" },
  );
  if (goal) {
    facts.push({ label: "Peso no seu curso", value: goal.weights[area].toLocaleString("pt-BR") });
    // "e se": a mesma projeção da meta, com 50 pontos a mais nesta área
    const base = projectGoal(goal, profile, pct);
    const from = now?.score ?? pct.areas[area].mean;
    const next = projectGoal(goal, { ...profile, [area]: { ...(now ?? { at: 0, attemptId: "", items: 0 }), score: Math.min(1000, from + 50) } }, pct);
    if (base.cutoff != null) {
      const gap = next.mean - base.cutoff;
      facts.push({
        label: "Se subir 50 pontos",
        value: `média ${fmtScore(next.mean)}`,
        hint: gap >= 0 ? "já passaria do corte" : `faltariam ${fmtScore(-gap)}`,
        tone: gap >= 0 ? "ok" : undefined,
      });
    } else {
      facts.push({ label: "Se subir 50 pontos", value: `+${fmtScore(next.mean - base.mean)}`, hint: "na sua média" });
    }
  } else {
    facts.push({ label: "No caderno", value: fmtInt(pendingInArea), hint: pendingInArea === 1 ? "questão para revisar" : "questões para revisar" });
    facts.push({ label: "Treino sugerido", value: "15 questões", hint: `${suggestedMinutes(15)} min, ritmo do ENEM` });
  }
  return (
    <dl className="relative mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-elev/80 sm:grid-cols-3">
      {facts.map((f) => (
        // no celular, uma linha por número (rótulo à esquerda, valor à direita); a partir do sm, três colunas
        <div
          key={f.label}
          className="flex items-baseline justify-between gap-3 border-line px-4 py-2.5 not-first:border-t sm:block sm:py-3 sm:not-first:border-t-0 sm:not-first:border-l"
        >
          <dt className="truncate text-[12px] text-ink-3">{f.label}</dt>
          <dd className="mt-0.5 flex flex-wrap items-baseline justify-end gap-x-1.5 sm:justify-start">
            <span className="text-[17px] font-semibold tracking-tight text-ink tabular">{f.value}</span>
            {f.hint ? <span className={cn("text-[12px]", f.tone === "ok" ? "text-ok" : "text-ink-3")}>{f.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink tabular">{children}</strong>;
}

/* ── Caderno ────────────────────────────────────────────────────────────── */

function NotebookCard({ pending, focus }: { pending: NotebookEntry[]; focus: Area }) {
  const [hovered, bind] = useHover();
  const byArea = AREAS.map((a) => [a, pending.filter((e) => e.area === a).length] as const).filter(([, n]) => n > 0);
  const total = pending.length;
  return (
    <Card className="flex flex-col p-5 sm:p-6" {...bind}>
      <HoverScope hovered={hovered}>
        <div className="flex items-center gap-2.5">
          <IconTile tone="warn" className="size-9">
            <AnimIcon icon={BookTextIcon} size={18} />
          </IconTile>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Caderno de erros</h2>
            <p className="text-[12.5px] text-ink-3">Erros, brancos e chutes certos</p>
          </div>
        </div>
        {total ? (
          <>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-semibold tracking-[-0.05em] text-ink">
                <CountUp value={total} decimals={0} />
              </span>
              <span className="text-[13px] text-ink-3">{total === 1 ? "questão para revisar" : "questões para revisar"}</span>
            </p>
            {/* barra empilhada: o tamanho de cada área no caderno, de relance */}
            <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
              {byArea.map(([a, n]) => (
                <span key={a} className="h-full" style={{ width: `${(n / total) * 100}%`, background: AREA_META[a].color }} />
              ))}
            </div>
            <ul className="mt-3 -mx-2">
              {byArea.map(([a, n]) => (
                <li key={a}>
                  <Link
                    href={`/caderno?area=${a}`}
                    className="flex h-9 items-center gap-2.5 rounded-xl px-2 text-[13px] text-ink-2 transition-colors hover:bg-hover hover:text-ink"
                  >
                    <AreaIcon area={a} size="sm" />
                    <span className="flex-1">
                      {AREA_META[a].short}
                      {a === focus ? <span className="ml-1.5 text-[11.5px] font-medium text-brand-ink">foco</span> : null}
                    </span>
                    <span className="font-mono text-ink tabular">{n}</span>
                    <ChevronRightIcon size={14} className="text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-5 text-[13.5px] leading-relaxed text-ink-3">
            Nada pendente. O que você errar, deixar em branco ou acertar no chute nos próximos simulados aparece aqui.
          </p>
        )}
        <ButtonLink href="/caderno" variant="secondary" className="mt-5 w-full sm:mt-auto">
          {total ? "Abrir caderno" : "Ver caderno"}
          <AnimIcon icon={ArrowRightIcon} size={16} />
        </ButtonLink>
      </HoverScope>
    </Card>
  );
}

/* ── Áreas ──────────────────────────────────────────────────────────────── */

function AreaTile({
  area,
  points,
  weight,
  minimum,
  focus,
  national,
  language,
}: {
  area: Area;
  points: { at: number; score: number }[];
  weight?: number;
  minimum: number | null;
  focus: boolean;
  national: number;
  language: "ingles" | "espanhol";
}) {
  const meta = AREA_META[area];
  const last = points.at(-1);
  const delta = points.length > 1 ? last!.score - points[0].score : null;
  const below = last != null && minimum != null && last.score < minimum;

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col rounded-2xl border bg-elev p-4 shadow-sm",
        last ? "border-line" : "border-dashed border-line-strong bg-transparent shadow-none",
        focus && "border-transparent ring-2 ring-brand/70",
      )}
    >
      {focus ? (
        // etiqueta sobre a borda: marca o foco sem roubar espaço do nome da área
        <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[10.5px] leading-tight font-semibold text-white">
          foco
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <AreaIcon area={area} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{meta.short}</span>
      </div>
      {last ? (
        <>
          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-ink tabular">{fmtInt(last.score)}</p>
            {delta != null ? <Delta value={delta} /> : null}
          </div>
          <Sparkline points={points.map((p) => p.score)} color={meta.color} className="mt-3" />
          <p className={cn("mt-2 truncate text-[11.5px]", below ? "text-bad" : "text-ink-3")}>
            {below
              ? `Mínimo do curso: ${fmtInt(minimum!)}`
              : [
                  weight != null ? `peso ${weight.toLocaleString("pt-BR")}` : null,
                  plural(points.length, "simulado", "simulados"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-[13px] leading-snug text-ink-3">
            Sem nota ainda. A projeção usa a média nacional ({fmtInt(national)}).
          </p>
          <div className="mt-auto pt-3">
            <StartAreaButton area={area} language={language} size="sm" variant="secondary" className="w-full">
              Fazer {meta.short}
            </StartAreaButton>
          </div>
        </>
      )}
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const v = Math.round(value);
  if (v === 0) return <span className="pb-0.5 text-[12px] text-ink-3">estável</span>;
  const up = v > 0;
  return (
    <span className={cn("flex items-center gap-0.5 pb-0.5 text-[12.5px] font-medium tabular", up ? "text-ok" : "text-bad")}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {up ? "+" : "−"}
      {Math.abs(v)}
    </span>
  );
}

/** Linha mínima da evolução da área. Com um ponto só, um traço reto (não há tendência ainda). */
function Sparkline({ points, color, className }: { points: number[]; color: string; className?: string }) {
  const W = 100;
  const H = 28;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = Math.max(hi - lo, 40);
  const mid = (hi + lo) / 2;
  const y = (v: number) => H - 3 - ((v - (mid - span / 2)) / span) * (H - 6);
  const x = (i: number) => (points.length < 2 ? (i ? W : 0) : (i / (points.length - 1)) * W);
  const pts = points.length < 2 ? [points[0], points[0]] : points;
  const lastY = y(pts.at(-1)!);
  return (
    <div className={cn("relative h-7", className)} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeOpacity={points.length < 2 ? 0.35 : 1}
          strokeDasharray={points.length < 2 ? "3 4" : undefined}
          points={pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        />
      </svg>
      <span
        className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-elev"
        style={{ top: `${(lastY / H) * 100}%`, background: color }}
      />
    </div>
  );
}

function RedacaoTile({ goal }: { goal: Goal }) {
  return (
    <div className="col-span-2 flex min-w-0 flex-col rounded-2xl border border-line bg-elev p-4 shadow-sm lg:col-span-1">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-sunken text-[10px] font-medium text-ink-3">RD</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">Redação</span>
      </div>
      <p className="mt-3 text-[28px] leading-none font-semibold tracking-[-0.04em] text-ink tabular">{fmtInt(goal.redacao)}</p>
      <p className="mt-auto pt-3 text-[11.5px] leading-snug text-ink-3">
        peso {(goal.weights.RE ?? 1).toLocaleString("pt-BR")} · sua estimativa (o SIMU não corrige redação).{" "}
        <Link href="/meta" className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink">
          Ajustar
        </Link>
      </p>
    </div>
  );
}

function GoalTile() {
  return (
    <Link
      href="/meta"
      className="col-span-2 flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-dashed border-line-strong p-4 transition-colors hover:bg-elev lg:col-span-1"
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
        <AnimIconOnMount icon={CompassIcon} size={16} className="text-brand-ink" /> Pesos do seu curso
      </span>
      <span className="text-[12.5px] leading-snug text-ink-3">
        Cada curso pesa as áreas de um jeito. Defina sua meta para ver os pesos aqui.
      </span>
    </Link>
  );
}

/* ── Histórico ──────────────────────────────────────────────────────────── */

// recolher só vale a pena quando esconde vários simulados
const HISTORY_PREVIEW = 5;
const HISTORY_COLLAPSE_FROM = HISTORY_PREVIEW + 3;

function HistoryCard({ done }: { done: Attempt[] }) {
  const [all, setAll] = useState(false);
  const sorted = done.toSorted((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const collapsible = sorted.length >= HISTORY_COLLAPSE_FROM;
  const shown = all || !collapsible ? sorted : sorted.slice(0, HISTORY_PREVIEW);
  const totals = done.reduce(
    (s, a) => ({
      questions: s.questions + a.result!.total,
      correct: s.correct + a.result!.correct,
      time: s.time + a.result!.durationSec,
    }),
    { questions: 0, correct: 0, time: 0 },
  );

  return (
    <Card className="mt-12 overflow-hidden">
      <CardHeader
        title="Histórico"
        description={
          <>
            {plural(done.length, "simulado", "simulados")} · {plural(totals.questions, "questão", "questões")} ·{" "}
            {totals.questions ? `${fmtInt((totals.correct / totals.questions) * 100)}% de acerto` : "–"} ·{" "}
            {fmtDuration(totals.time, { short: true })} de prova
          </>
        }
      />
      <ul className="mt-4 divide-y divide-line border-t border-line">
        {shown.map((a) => (
          <HistoryRow key={a.id} attempt={a} />
        ))}
      </ul>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="flex h-12 w-full items-center justify-center border-t border-line text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken/70 hover:text-ink"
        >
          {all ? "Mostrar menos" : `Mostrar os ${sorted.length - HISTORY_PREVIEW} simulados anteriores`}
        </button>
      ) : null}
    </Card>
  );
}

function HistoryRow({ attempt }: { attempt: Attempt }) {
  const r = attempt.result!;
  const areas = AREAS.filter((a) => r.areas[a]);
  const [hovered, bind] = useHover();
  return (
    <li>
      <Link
        href={`/resultado?id=${attempt.id}`}
        {...bind}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sunken/70 sm:px-6"
      >
        <HoverScope hovered={hovered}>
          <AreaIcons areas={areas} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-ink">{attempt.title}</span>
            <span className="block text-[12.5px] text-ink-3">
              {fmtDate(attempt.finishedAt ?? attempt.updatedAt)} · {r.correct}/{r.total} acertos ·{" "}
              {fmtDuration(r.durationSec, { short: true })}
            </span>
          </span>
          <span className="hidden gap-4 sm:flex">
            {areas.map((a) => (
              <span key={a} className="text-right">
                <span className="block text-[11px] text-ink-3">{AREA_META[a].short}</span>
                <span className="block text-[14px] font-medium text-ink tabular">
                  {r.areas[a]!.score != null ? fmtInt(r.areas[a]!.score!) : "–"}
                </span>
              </span>
            ))}
          </span>
          <AnimIcon icon={ChevronRightIcon} size={16} className="text-ink-3" />
        </HoverScope>
      </Link>
    </li>
  );
}

/* ── Prova em andamento ─────────────────────────────────────────────────── */

function ActiveCard({ attempt }: { attempt: Attempt }) {
  const answered = Object.values(attempt.answers).filter((a) => a.choice).length;
  return (
    // no celular o ícone fica ao lado do texto e o botão desce para uma linha inteira
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand/30 bg-brand-softer p-4 sm:flex-nowrap sm:p-5">
      <AreaIcons areas={presetAreas(attempt.config)} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-brand-ink">Em andamento · pausada {fmtDate(attempt.updatedAt).toLowerCase()}</p>
        <p className="truncate text-[15px] font-semibold text-ink">{attempt.title}</p>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={(answered / attempt.items.length) * 100} className="min-w-12 flex-1 sm:w-40 sm:flex-none" />
          <span className="shrink-0 text-[12.5px] text-ink-3 tabular">
            {answered}/{attempt.items.length} · {fmtDuration(attempt.elapsedSec, { short: true })} de prova
          </span>
        </div>
      </div>
      <ButtonLink href={`/prova?id=${attempt.id}`} className="w-full sm:w-auto">
        <AnimIcon icon={PlayIcon} size={16} /> Continuar
      </ButtonLink>
    </div>
  );
}

/* ── Dados ──────────────────────────────────────────────────────────────── */

function DataCard({ hasData }: { hasData: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "bad" } | null>(null);

  function doExport() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    // revogar na hora pode cancelar o download em alguns navegadores
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ text: "Backup baixado. Abra-o no outro aparelho em “Importar”.", tone: "ok" });
  }

  async function doImport(file: File) {
    try {
      const n = importBackup(JSON.parse(await file.text()));
      setMessage({ text: `${n} ${n === 1 ? "simulado importado" : "simulados importados"}.`, tone: "ok" });
    } catch (e) {
      // JSON.parse falha com uma mensagem técnica em inglês; quem estuda precisa saber só o que houve
      const text =
        e instanceof SyntaxError
          ? "Esse arquivo não é um backup do SIMU."
          : e instanceof Error
            ? e.message
            : "Não foi possível importar esse arquivo.";
      setMessage({ text, tone: "bad" });
    }
  }

  return (
    <section className="mt-12 rounded-3xl border border-dashed border-line-strong p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[14.5px] font-medium text-ink">Seus dados, suas regras</p>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-3">
            Sem conta, nada sai deste navegador. Para estudar em outro aparelho, exporte um arquivo de backup e
            importe por lá.
          </p>
          {message ? (
            <p role="status" className={cn("mt-2 text-[13px]", message.tone === "bad" ? "text-bad" : "text-ok")}>
              {message.text}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={doExport} disabled={!hasData}>
            <AnimIcon icon={DownloadIcon} size={15} /> Exportar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <AnimIcon icon={UploadIcon} size={15} /> Importar
          </Button>
          {hasData ? (
            <ConfirmMorph
              label="Apagar tudo"
              icon={<Trash2 className="size-4" />}
              confirmMode="hold"
              holdDuration={1200}
              prompt="Segure para apagar tudo"
              confirmLabel="Segure para apagar"
              cancelLabel="Cancelar"
              pendingLabel="Apagando"
              doneLabel="Tudo apagado"
              onConfirm={async () => {
                await new Promise((r) => setTimeout(r, 400));
                clearAll();
                setMessage({ text: "Tudo apagado.", tone: "ok" });
              }}
            />
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ── Esqueletos ─────────────────────────────────────────────────────────── */

function OverviewSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <Skeleton className="h-80 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <Skeleton className="h-9 w-full max-w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-96" />
      <OverviewSkeleton />
    </div>
  );
}

/* ── Ações que abrem uma prova ──────────────────────────────────────────── */

/** Treino de uma área só, no ritmo do ENEM. */
function StartAreaButton({
  area,
  language,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  area: Area;
  language: "ingles" | "espanhol";
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={pending}
      onClick={() =>
        start(async () => {
          const a = await createAttempt({
            preset: "area",
            areas: [area],
            year: "mix",
            count: 15,
            language,
            timeLimitMin: suggestedMinutes(15),
          });
          router.push(`/prova?id=${a.id}`);
        })
      }
    >
      <AnimIcon icon={PlayIcon} size={size === "sm" ? 14 : 16} />
      {children}
    </Button>
  );
}

/** Botão para refazer uma lista de questões (usado no caderno). */
export function RedoButton({
  items,
  label,
  variant = "primary",
  className,
}: {
  items: { id: string; area: (typeof AREAS)[number] }[];
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      className={className}
      disabled={!items.length}
      loading={pending}
      onClick={() =>
        start(async () => {
          const areas = AREAS.filter((a) => items.some((i) => i.area === a));
          const a = await createAttempt(
            { preset: "caderno", areas, year: "mix", count: items.length, language: "ingles", timeLimitMin: null },
            items,
          );
          router.push(`/prova?id=${a.id}`);
        })
      }
    >
      <AnimIcon icon={PlayIcon} size={16} />
      {label}
    </Button>
  );
}
