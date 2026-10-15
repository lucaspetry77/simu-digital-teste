"use client";

import { AnimatePresence, motion } from "motion/react";
import { motionTokens } from "@/components/arc/lib/motion-tokens";
import Link from "next/link";
import { Check, CircleDashed, Dices, RotateCcw, X } from "lucide-react";
import { ChipGroup } from "@/components/arc/chip-group/chip-group";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { BookTextIcon } from "@/components/icons/book-text";
import { AnimIconOnMount } from "@/components/ui/anim-icon";
import { Suspense, use, useMemo, useState } from "react";
import { AreaIcon } from "@/components/ui/area-icon";
import { Badge } from "@/components/ui/badge";
import { BrowserOnly, Skeleton } from "@/components/ui/browser-only";
import { ButtonLink } from "@/components/ui/button";

import { Segmented } from "@/components/ui/segmented";
import { AREA_META, AREAS, type Area, competencia } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { loadCatalog } from "@/lib/data";
import { fmtDate, plural } from "@/lib/format";
import { type NotebookEntry, notebookEntries } from "@/lib/simulado";
import { reopenNotebookItem, resolveNotebookItems, useAttempts, useNotebookState } from "@/lib/store";
import { difficultyOf, DIFFICULTY_LABEL } from "@/lib/tri";
import { RedoButton } from "./dashboard";

const REASON = {
  erro: { label: "Errou", icon: X, tone: "bad" as const },
  branco: { label: "Em branco", icon: CircleDashed, tone: "warn" as const },
  chute: { label: "Acertou no chute", icon: Dices, tone: "brand" as const },
};
const TONE_TEXT = { bad: "text-bad", warn: "text-warn", brand: "text-brand-ink", ok: "text-ok" };

export function Notebook() {
  return (
    <BrowserOnly fallback={<NotebookSkeleton />}>
      <Suspense fallback={<NotebookSkeleton />}>
        <NotebookInner />
      </Suspense>
    </BrowserOnly>
  );
}

// mesma largura e respiro lateral da página, para o esqueleto não encostar nas bordas no celular
function NotebookSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

function NotebookInner() {
  const catalog = use(loadCatalog());
  const attempts = useAttempts();
  const state = useNotebookState();
  const entries = useMemo(() => notebookEntries(attempts, state), [attempts, state]);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  // o painel abre o caderno já filtrado (/caderno?area=MT)
  const [area, setArea] = useState<Area | "all">(() => {
    const p = new URLSearchParams(window.location.search).get("area");
    return AREAS.find((a) => a === p) ?? "all";
  });

  const pending = entries.filter((e) => !e.resolvedAt);
  const resolved = entries.filter((e) => e.resolvedAt);
  const base = tab === "pending" ? pending : resolved;
  const areaOptions = AREAS.filter((a) => base.some((e) => e.area === a));
  // se a área escolhida some desta aba (resolveu tudo ou trocou de aba), volta para "Todas"
  const activeArea = area !== "all" && areaOptions.includes(area) ? area : "all";
  const list = base.filter((e) => activeArea === "all" || e.area === activeArea);
  const redo = list.slice(0, 45);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-xl">
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] text-ink">
            O que vale estudar de novo
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">
            Tudo o que você errou, deixou em branco ou acertou no chute. Refaça até acertar com segurança. Quando
            acertar numa revisão, a questão sai daqui sozinha.
          </p>
        </div>
        {tab === "pending" && redo.length ? (
          <RedoButton items={redo.map((e) => ({ id: e.id, area: e.area }))} label={`Refazer ${plural(redo.length, "questão", "questões")}`} />
        ) : null}
      </div>

      {!entries.length ? (
        <div className="mt-10 rounded-3xl border border-line bg-elev py-6 shadow-sm">
          <EmptyState
            icon={<AnimIconOnMount icon={BookTextIcon} size={22} />}
            title="Seu caderno está vazio"
            description="Depois do primeiro simulado, os erros e os chutes aparecem aqui, prontos para revisar."
            action={<ButtonLink href="/novo">Fazer um simulado</ButtonLink>}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              label="Situação"
              value={tab}
              onChange={setTab}
              options={[
                { value: "pending", label: `Para revisar · ${pending.length}` },
                { value: "done", label: `Dominadas · ${resolved.length}` },
              ]}
            />
            <ChipGroup
              label="Filtrar por área"
              multiple={false}
              value={[activeArea]}
              onValueChange={(v) => setArea((v[0] as Area | "all" | undefined) ?? "all")}
              options={[
                { value: "all", label: "Todas" },
                ...areaOptions.map((a) => ({
                  value: a,
                  label: `${AREA_META[a].short} · ${base.filter((e) => e.area === a).length}`,
                })),
              ]}
            />
          </div>

          <ul className="mt-5 space-y-2">
            <AnimatePresence initial={false}>
            {list.length === 0 ? (
              <li className="rounded-3xl border border-line bg-elev px-5 py-12 text-center text-[14px] text-ink-3">
                {tab === "pending" ? "Nada pendente aqui. Bom trabalho!" : "Ainda nenhuma questão dominada."}
              </li>
            ) : null}
            {list.map((e) => (
              <EntryRow key={e.id} entry={e} catalog={catalog} />
            ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}

function EntryRow({ entry, catalog }: { entry: NotebookEntry; catalog: Awaited<ReturnType<typeof loadCatalog>> }) {
  const meta = catalog.byId.get(entry.id);
  const comp = competencia(entry.area, meta?.skill);
  const diff = difficultyOf(entry.area, meta?.b, catalog);
  const reason = REASON[entry.reason];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={motionTokens.spring.smooth}
      className="flex items-center gap-4 rounded-3xl border border-line bg-elev px-4 py-3.5 shadow-sm sm:px-5"
    >
      <AreaIcon area={entry.area} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{comp?.label ?? AREA_META[entry.area].short}</p>
        <p className="truncate text-[12.5px] text-ink-3">
          {/* no celular o selo some; o motivo vem no começo da linha, que trunca pelo fim */}
          <span className={cn("font-medium sm:hidden", TONE_TEXT[entry.resolvedAt ? "ok" : reason.tone])}>
            {entry.resolvedAt ? "Dominada" : reason.label} ·{" "}
          </span>
          ENEM {meta?.year} · questão {meta?.number}
          {diff ? ` · ${DIFFICULTY_LABEL[diff]}` : ""} ·{" "}
          <Link href={`/resultado?id=${entry.attemptId}`} className="hover:text-ink hover:underline">
            {fmtDate(entry.at)}
          </Link>
        </p>
      </div>
      <Badge tone={entry.resolvedAt ? "ok" : reason.tone} className="hidden sm:inline-flex">
        {entry.resolvedAt ? <Check /> : <reason.icon />}
        {entry.resolvedAt ? "Dominada" : reason.label}
      </Badge>
      {entry.resolvedAt ? (
        <button
          type="button"
          onClick={() => reopenNotebookItem(entry.id)}
          title="Voltar para revisão"
          aria-label="Voltar para revisão"
          className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
        >
          <RotateCcw className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => resolveNotebookItems([entry.id])}
          title="Já domino esta"
          aria-label="Marcar como dominada"
          className={"grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-ok-soft hover:text-ok"}
        >
          <Check className="size-4" />
        </button>
      )}
    </motion.li>
  );
}
