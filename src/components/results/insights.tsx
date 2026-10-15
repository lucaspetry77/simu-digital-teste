"use client";

import { CircleCheck, CircleHelp, Dices, Minus } from "lucide-react";
import { ChartColumnIncreasingIcon } from "@/components/icons/chart-column-increasing";
import { GaugeIcon } from "@/components/icons/gauge";
import { LayersIcon } from "@/components/icons/layers";
import { TimerIcon } from "@/components/icons/timer";
import { AnimIcon, type AnimatedIcon, HoverScope, useHover } from "@/components/ui/anim-icon";
import { Card } from "@/components/ui/card";
import { AREA_META } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { fmtDuration, fmtPct } from "@/lib/format";
import { SECONDS_PER_QUESTION } from "@/lib/simulado";
import type { Confidence } from "@/lib/store";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/tri";
import type { ReviewRow } from "./types";

function InsightCard({
  icon,
  title,
  children,
  message,
  tone = "neutral",
  className,
}: {
  icon: AnimatedIcon;
  title: string;
  children: React.ReactNode;
  message?: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
  className?: string;
}) {
  const [hovered, bind] = useHover();
  return (
    <Card className={cn("lift flex flex-col p-5 sm:p-6", className)} {...bind}>
      <HoverScope hovered={hovered}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-sunken text-ink-2">
          <AnimIcon icon={icon} size={16} />
        </span>
        <h3 className="text-[14.5px] font-semibold text-ink">{title}</h3>
      </div>
      <div className="mt-5 flex-1">{children}</div>
      {message ? (
        <p
          className={cn(
            "mt-5 rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed",
            tone === "ok" ? "bg-ok-soft text-ink" : tone === "warn" ? "bg-warn-soft text-ink" : "bg-sunken text-ink-2",
          )}
        >
          {message}
        </p>
      ) : null}
      </HoverScope>
    </Card>
  );
}

function Bar({ value, color = "var(--brand)" }: { value: number; color?: string }) {
  return (
    <span className="block h-2 flex-1 overflow-hidden rounded-full bg-sunken">
      <span
        className="block h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </span>
  );
}

/* ── Coerência TRI ───────────────────────────────────────────────────── */
export function CoherenceCard({ rows }: { rows: ReviewRow[] }) {
  const levels: Difficulty[] = ["facil", "media", "dificil"];
  const stats = levels.map((d) => {
    const list = rows.filter((r) => r.difficulty === d && r.status !== "void");
    const ok = list.filter((r) => r.status === "ok").length;
    return { d, ok, total: list.length, pct: list.length ? (ok / list.length) * 100 : null };
  });
  const [easy, , hard] = stats;
  const incoherent = easy.pct != null && hard.pct != null && hard.total >= 2 && easy.total >= 2 && hard.pct > easy.pct;
  const missedEasy = rows.filter((r) => r.difficulty === "facil" && (r.status === "bad" || r.status === "blank")).length;

  return (
    <InsightCard
      icon={ChartColumnIncreasingIcon}
      title="Coerência na TRI"
      tone={incoherent ? "warn" : missedEasy === 0 && easy.total ? "ok" : "neutral"}
      message={
        incoherent ? (
          <>
            Você acertou mais difíceis do que fáceis. A TRI lê isso como <strong>possível chute</strong> e reduz a nota.
            Garanta as fáceis primeiro.
          </>
        ) : missedEasy ? (
          <>
            {missedEasy === 1 ? "Uma questão fácil escapou" : `${missedEasy} questões fáceis escaparam`}. Na TRI, as fáceis
            são as que mais pesam contra. Vale revisá-las primeiro.
          </>
        ) : easy.total ? (
          <>Padrão coerente: você garantiu as fáceis. É isso que a TRI recompensa.</>
        ) : (
          <>A dificuldade vem dos parâmetros do INEP para cada questão.</>
        )
      }
    >
      <div className="space-y-3.5">
        {stats.map((s) => (
          <div key={s.d} className="flex items-center gap-3 text-[13px]">
            <span className="w-14 text-ink-2">{DIFFICULTY_LABEL[s.d]}</span>
            <Bar
              value={s.pct ?? 0}
              color={s.d === "facil" ? "var(--ok)" : s.d === "media" ? "var(--warn)" : "var(--bad)"}
            />
            <span className="w-12 text-right text-[12.5px] text-ink tabular">
              {s.total ? `${s.ok}/${s.total}` : "–"}
            </span>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

/* ── Calibração da confiança ─────────────────────────────────────────── */
const CONF: { value: Confidence | "none"; label: string; icon: typeof CircleCheck; color: string }[] = [
  { value: "sure", label: "Certeza", icon: CircleCheck, color: "var(--ok)" },
  { value: "unsure", label: "Dúvida", icon: CircleHelp, color: "var(--warn)" },
  { value: "guess", label: "Chute", icon: Dices, color: "var(--bad)" },
  { value: "none", label: "Sem marcar", icon: Minus, color: "var(--ink-3)" },
];

export function ConfidenceCard({ rows }: { rows: ReviewRow[] }) {
  const answered = rows.filter((r) => r.ans?.choice && r.status !== "void");
  const groups = CONF.map((c) => {
    const list = answered.filter((r) => (r.ans?.confidence ?? "none") === c.value);
    const ok = list.filter((r) => r.status === "ok").length;
    return { ...c, ok, total: list.length, pct: list.length ? (ok / list.length) * 100 : null };
  }).filter((g) => g.total > 0 || g.value !== "none");

  const sureWrong = answered.filter((r) => r.ans?.confidence === "sure" && r.status === "bad").length;
  const guess = groups.find((g) => g.value === "guess")!;
  const sure = groups.find((g) => g.value === "sure")!;
  const marked = answered.filter((r) => r.ans?.confidence).length;

  let message: React.ReactNode;
  let tone: "neutral" | "ok" | "warn" = "neutral";
  if (!marked) {
    message = <>Na próxima prova, marque certeza, dúvida ou chute depois de responder. Aqui aparece o quanto sua intuição acerta.</>;
  } else if (sureWrong > 0) {
    tone = "warn";
    message = (
      <>
        Você errou <strong>{sureWrong}</strong> {sureWrong === 1 ? "questão" : "questões"} com certeza. Esses são os
        enganos mais valiosos: o conceito parece claro, mas não está. Revise com calma.
      </>
    );
  } else if (sure.total && sure.pct === 100) {
    tone = "ok";
    message = <>Quando você tem certeza, acerta. Ótima calibração: confie mais em você na hora da prova.</>;
  } else if (guess.total >= 3) {
    message = (
      <>
        Seus chutes acertaram {fmtPct(guess.pct ?? 0)} (o acaso daria 20%).{" "}
        {(guess.pct ?? 0) > 30 ? "Sua eliminação de alternativas está funcionando." : "Tente riscar alternativas antes de chutar."}
      </>
    );
  } else {
    message = <>Os acertos de chute e de dúvida vão para o caderno de erros, para você estudar até ter certeza.</>;
  }

  return (
    <InsightCard icon={GaugeIcon} title="Sua confiança" message={message} tone={tone}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <div key={g.value} className="rounded-2xl border border-line px-3 py-2.5">
            <g.icon className="size-4" style={{ color: g.color }} />
            <p className="mt-2 text-[17px] font-semibold text-ink tabular">
              {g.pct != null ? fmtPct(g.pct) : "–"}
            </p>
            <p className="text-[11.5px] text-ink-3">
              {g.label} · {g.ok}/{g.total}
            </p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

/* ── Ritmo ───────────────────────────────────────────────────────────── */
export function PaceCard({ rows, onOpen }: { rows: ReviewRow[]; onOpen: (i: number) => void }) {
  const times = rows.map((r) => r.time);
  const total = times.reduce((s, t) => s + t, 0);
  // média só das questões que você chegou a abrir: as nunca vistas (0s) puxariam a média para baixo
  const seen = times.filter((t) => t > 0).length;
  const avg = seen ? total / seen : 0;
  const hasBlank = rows.some((r) => r.status === "blank" || r.status === "void");
  const max = Math.max(SECONDS_PER_QUESTION * 1.5, ...times);
  const slowest = rows.toSorted((a, b) => b.time - a.time)[0];
  const refPos = (SECONDS_PER_QUESTION / max) * 100;

  return (
    <InsightCard
      icon={TimerIcon}
      title="Ritmo por questão"
      tone={!seen ? "neutral" : avg <= SECONDS_PER_QUESTION ? "ok" : "warn"}
      message={
        !seen ? undefined : avg <= SECONDS_PER_QUESTION ? (
          <>
            Média de <strong>{fmtDuration(avg)}</strong> por questão, dentro do ritmo do ENEM (3 min).
          </>
        ) : (
          <>
            Média de <strong>{fmtDuration(avg)}</strong> por questão, acima dos 3 min do ENEM. Pular e voltar depois
            ajuda a não travar.
          </>
        )
      }
    >
      <div className="relative h-28">
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onOpen(r.i)}
              title={`Questão ${r.i + 1}: ${fmtDuration(r.time)}`}
              aria-label={`Questão ${r.i + 1}, ${fmtDuration(r.time)}`}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <span
                className={cn(
                  "block w-full origin-bottom animate-[grow_0.8s_cubic-bezier(0.16,1,0.3,1)_both] rounded-t-[3px] transition-opacity hover:opacity-70",
                  r.status === "ok" ? "bg-ok" : r.status === "bad" ? "bg-bad" : "bg-line-strong",
                )}
                style={{ height: `${Math.max(3, (r.time / max) * 100)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-3/60" style={{ bottom: `${refPos}%` }}>
          <span className="absolute right-0 -top-4 text-[10.5px] text-ink-3">3 min</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-3">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-ok" /> acerto
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-bad" /> erro
          </span>
          {hasBlank ? (
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-line-strong" /> em branco
            </span>
          ) : null}
        </span>
        {slowest && slowest.time > 0 ? (
          <button type="button" onClick={() => onOpen(slowest.i)} className="hover:text-ink">
            Mais demorada: Q{slowest.i + 1} · {fmtDuration(slowest.time)}
          </button>
        ) : null}
      </div>
    </InsightCard>
  );
}

/* ── Competências ────────────────────────────────────────────────────── */
export function CompetenciasCard({ rows }: { rows: ReviewRow[] }) {
  const map = new Map<string, { label: string; area: ReviewRow["area"]; ok: number; total: number }>();
  for (const r of rows) {
    if (!r.comp || r.status === "void") continue;
    const k = `${r.area}-${r.comp.code}`;
    const e = map.get(k) ?? { label: r.comp.label, area: r.area, ok: 0, total: 0 };
    e.total++;
    if (r.status === "ok") e.ok++;
    map.set(k, e);
  }
  const list = [...map.values()].toSorted((a, b) => b.ok / b.total - a.ok / a.total || b.total - a.total);
  if (!list.length) return null;
  const multiArea = new Set(list.map((l) => l.area)).size > 1;

  return (
    <InsightCard
      icon={LayersIcon}
      title="Por competência"
      message={
        <>
          Agrupamos as habilidades do INEP (H1–H30) nas competências da Matriz de Referência do ENEM. Com poucas
          questões por grupo, trate como pista, não como veredito.
        </>
      }
    >
      <div className="space-y-3">
        {list.map((c) => {
          const pct = (c.ok / c.total) * 100;
          return (
            <div key={`${c.area}-${c.label}`} className="flex items-center gap-3 text-[13px]">
              <span className="w-40 truncate text-ink-2" title={c.label}>
                {multiArea ? (
                  <span className="mr-1.5 inline-block size-1.5 rounded-full align-middle" style={{ background: AREA_META[c.area].color }} />
                ) : null}
                {c.label}
              </span>
              <Bar value={pct} color={pct >= 70 ? "var(--ok)" : pct >= 40 ? "var(--warn)" : "var(--bad)"} />
              <span className="w-10 text-right text-[12.5px] text-ink tabular">
                {c.ok}/{c.total}
              </span>
            </div>
          );
        })}
      </div>
    </InsightCard>
  );
}
