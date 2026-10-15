"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Clock, FileQuestion, Info, ListChecks, Trash2 } from "lucide-react";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { InViewTitle } from "@/components/arc/in-view-title/in-view-title";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { RotateCCWIcon } from "@/components/icons/rotate-ccw";
import { AnimIcon } from "@/components/ui/anim-icon";
import { Suspense, use, useMemo, useState, useTransition } from "react";
import { GoalEmpty, GoalProgress } from "@/components/goal/goal-progress";
import { AreaIcon, AreaIcons } from "@/components/ui/area-icon";
import { BrowserOnly, Skeleton } from "@/components/ui/browser-only";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AREA_META, AREAS, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { type Catalog, loadCatalog, loadPercentiles, loadQuestions, once, type Percentiles, type Question } from "@/lib/data";
import { fmtDate, fmtDuration, fmtInt, fmtScore } from "@/lib/format";
import { scoreProfile } from "@/lib/simulado";
import { createAttempt } from "@/lib/start";
import { type Attempt, deleteAttempt, useAttempt, useAttempts, useGoal } from "@/lib/store";
import { CoherenceCard, CompetenciasCard, ConfidenceCard, PaceCard } from "./insights";
import { ReviewList, ReviewModal } from "./review";
import { AreaScoreRow, CountUp, Distribution, percentileSentence, Ring } from "./score-hero";
import { buildRows } from "./types";

export function ResultPage() {
  return (
    <BrowserOnly fallback={<ResultSkeleton />} reason="Os resultados ficam salvos neste navegador.">
      <ResultLoader />
    </BrowserOnly>
  );
}

function ResultLoader() {
  const id = useSearchParams().get("id");
  const attempt = useAttempt(id);
  if (!attempt || attempt.status !== "done" || !attempt.result) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sunken text-ink-3">
          <FileQuestion className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-ink">Resultado não encontrado</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          Sem conta, cada navegador guarda os próprios simulados. Se você fez a prova em outro aparelho, exporte e
          importe o backup pelo painel.
        </p>
        <ButtonLink href="/painel" className="mt-6">
          Ir para o painel
        </ButtonLink>
      </div>
    );
  }
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <ResultData attempt={attempt} />
    </Suspense>
  );
}

function ResultData({ attempt }: { attempt: Attempt }) {
  const [questions, catalog, pct] = use(
    once(`result:${attempt.id}`, () =>
      Promise.all([loadQuestions(attempt.items.map((i) => i.id)), loadCatalog(), loadPercentiles()]),
    ),
  );
  return <ResultView attempt={attempt} questions={questions} catalog={catalog} pct={pct} />;
}

function ResultView({
  attempt,
  questions,
  catalog,
  pct,
}: {
  attempt: Attempt;
  questions: Question[];
  catalog: Catalog;
  pct: Percentiles;
}) {
  const router = useRouter();
  const result = attempt.result!;
  const areas = AREAS.filter((a) => result.areas[a]);
  const [areaSel, setArea] = useState<Area>(areas[0]);
  const [open, setOpen] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const attempts = useAttempts();
  const goal = useGoal();
  const rows = useMemo(() => buildRows(attempt, questions, catalog), [attempt, questions, catalog]);
  const profile = useMemo(() => scoreProfile(attempts), [attempts]);

  const r = result.areas[areaSel]!;
  const multi = areas.length > 1;
  const scored = areas.map((a) => result.areas[a]!.score).filter((s): s is number => s != null);
  const average = scored.length ? scored.reduce((s, x) => s + x, 0) / scored.length : null;
  const toReview = rows.filter((x) => x.status === "bad" || x.status === "blank" || x.ans?.confidence === "guess");
  const isCaderno = attempt.config.preset === "caderno";

  function redoMistakes() {
    start(async () => {
      const a = await createAttempt(
        { ...attempt.config, preset: "caderno", year: "mix", timeLimitMin: null, count: toReview.length },
        toReview.map((x) => ({ id: x.id, area: x.area })),
      );
      router.push(`/prova?id=${a.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13.5px] text-ink-3">
            <AreaIcons areas={areas} size="sm" play />
            {isCaderno ? "Revisão do caderno de erros" : "Resultado do simulado"}
          </p>
          <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-[36px]">
            {attempt.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> {fmtDate(attempt.finishedAt ?? attempt.updatedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> {fmtDuration(result.durationSec)}
              {attempt.config.timeLimitMin ? ` de ${fmtDuration(attempt.config.timeLimitMin * 60, { short: true })}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <ListChecks className="size-3.5" /> {result.total} questões
            </span>
          </p>
        </div>
        {/* no celular os dois botões dividem a linha e quebram para baixo quando não cabem (320px) */}
        <div className="flex shrink-0 flex-wrap gap-2 *:grow md:*:grow-0">
          {toReview.length ? (
            <Button variant="secondary" onClick={redoMistakes} loading={pending}>
              <AnimIcon icon={RotateCCWIcon} size={16} />
              Refazer {toReview.length} {toReview.length === 1 ? "questão" : "questões"}
            </Button>
          ) : null}
          <ButtonLink href="/novo">
            Novo simulado
            <AnimIcon icon={ArrowRightIcon} size={16} />
          </ButtonLink>
        </div>
      </div>

      {/* Nota */}
      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-7">
          {multi ? (
            <div className="mb-6 flex flex-col gap-2 sm:flex-row">
              {areas.map((a) => (
                <AreaScoreRow key={a} area={a} r={result.areas[a]!} active={a === areaSel} onClick={() => setArea(a)} />
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[12.5px] font-medium text-ink-3">
                Nota TRI estimada{multi ? ` · ${AREA_META[areaSel].short}` : ""}
              </p>
              {r.score != null ? (
                <p className="mt-2 text-[72px] leading-[0.9] font-semibold tracking-[-0.055em] text-ink sm:text-[88px]">
                  <CountUp key={areaSel} value={r.score} />
                </p>
              ) : (
                <p className="mt-2 text-[15px] text-ink-2">Sem itens com parâmetro TRI nesta área.</p>
              )}
              {r.se != null && r.score != null ? (
                <p className="mt-3 text-[13px] text-ink-3">
                  Faixa provável: <span className="font-medium text-ink tabular">{fmtInt(r.score - 1.96 * r.se)}</span> a{" "}
                  <span className="font-medium text-ink tabular">{fmtInt(r.score + 1.96 * r.se)}</span>
                  <span className="mx-1.5">·</span>
                  {r.triItems} {r.triItems === 1 ? "item" : "itens"} na TRI
                </p>
              ) : null}
            </div>
            {multi && average != null ? (
              <div className="text-right">
                <p className="text-[12px] text-ink-3">Média das áreas</p>
                <p className="text-[24px] font-semibold tracking-[-0.03em] text-ink tabular">{fmtScore(average)}</p>
              </div>
            ) : null}
          </div>

          {r.score != null ? (
            <div className="mt-8">
              <Distribution area={areaSel} score={r.score} pct={pct} />
              <p className="mt-4 text-[13.5px] text-ink-2">{percentileSentence(r.percentile, areaSel, pct.year)}</p>
            </div>
          ) : null}

          {r.triItems < 15 ? (
            <p className="mt-5 flex gap-2 rounded-2xl bg-sunken px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
              Com poucas questões a estimativa fica perto da média e a faixa é larga. Para uma nota mais firme, faça
              30 ou mais questões da área.
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="flex items-center gap-5 p-5 sm:p-6">
            <div className="relative">
              <Ring value={result.total ? result.correct / result.total : 0} size={68} stroke={7} color="var(--ok)" />
              <span className="absolute inset-0 grid place-items-center text-[13px] font-medium text-ink">
                {result.total ? Math.round((result.correct / result.total) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-[12.5px] text-ink-3">Acertos</p>
              <p className="text-[26px] font-semibold text-ink tabular">
                {result.correct}
                <span className="text-ink-3">/{result.total}</span>
              </p>
              <p className="text-[12.5px] text-ink-3">
                {result.total - result.answered > 0 ? `${result.total - result.answered} em branco` : "Nenhuma em branco"}
              </p>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <p className="text-[12.5px] text-ink-3">Por área</p>
            <ul className="mt-3 space-y-3">
              {areas.map((a) => {
                const ar = result.areas[a]!;
                return (
                  <li key={a} className="flex items-center gap-3">
                    <AreaIcon area={a} size="sm" />
                    <span className="flex-1 text-[13.5px] text-ink-2">{AREA_META[a].short}</span>
                    <span className="text-[13px] text-ink-3 tabular">
                      {ar.correct}/{ar.total}
                    </span>
                    <span className="w-14 text-right text-[13.5px] font-medium text-ink tabular">
                      {ar.score != null ? fmtInt(ar.score) : "–"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-3">
              Estimativa educacional com parâmetros do INEP. Não é a nota oficial.
            </p>
          </Card>
        </div>
      </div>

      {/* Meta */}
      {!isCaderno ? (
        <section className="mt-4">
          {goal ? <GoalProgress goal={goal} profile={profile} pct={pct} focusArea={areaSel} /> : <GoalEmpty />}
        </section>
      ) : null}

      {/* Diagnóstico */}
      <section className="mt-14">
        <SectionTitle
          eyebrow="Diagnóstico"
          title="O que esta prova diz sobre você"
          text="Além de quantas você acertou: como você respondeu."
        />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CoherenceCard rows={rows} />
          <ConfidenceCard rows={rows} />
          <PaceCard rows={rows} onOpen={setOpen} />
          <CompetenciasCard rows={rows} />
        </div>
      </section>

      {/* Gabarito */}
      <section className="mt-14">
        <SectionTitle
          eyebrow="Gabarito comentado"
          title="Revise questão por questão"
          text="Erros, brancos e acertos no chute vão automaticamente para o seu caderno de erros."
        />
        <div className="mt-6">
          <ReviewList rows={rows} onOpen={setOpen} />
        </div>
      </section>

      <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-[12.5px] text-ink-3 sm:flex-row sm:items-center">
        <p>
          Código deste simulado: <span className="text-ink-2">{attempt.id}</span> · salvo só neste navegador
        </p>
        <ConfirmMorph
          label="Apagar este resultado"
          icon={<Trash2 className="size-4" />}
          prompt="Apagar de vez?"
          confirmLabel="Apagar"
          cancelLabel="Cancelar"
          pendingLabel="Apagando"
          doneLabel="Apagado"
          tone="danger"
          onConfirm={async () => {
            await new Promise((r) => setTimeout(r, 450));
            deleteAttempt(attempt.id);
            router.replace("/painel");
          }}
        />
      </div>

      <ReviewModal rows={rows} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}

function SectionTitle({ title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div>
      <InViewTitle text={title} className="text-[24px] font-semibold tracking-[-0.03em] text-ink" />
      {text ? <p className="mt-1 text-[14px] text-ink-3">{text}</p> : null}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-10 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full max-w-80" />
      <div className={cn("grid grid-cols-1 gap-4 pt-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]")}>
        <Skeleton className="h-96 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
