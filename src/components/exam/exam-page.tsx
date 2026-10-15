"use client";

import { useSearchParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { Suspense, use, useState } from "react";
import { BrowserOnly, Skeleton } from "@/components/ui/browser-only";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { loadCatalog, loadPercentiles, loadQuestions, loadTri, once } from "@/lib/data";
import { type Attempt, getAttempt } from "@/lib/store";
import { ExamScreen } from "./exam-screen";

export function ExamPage() {
  return (
    <BrowserOnly fallback={<ExamSkeleton />} reason="A prova fica salva no navegador.">
      <ExamLoader />
    </BrowserOnly>
  );
}

function ExamLoader() {
  const params = useSearchParams();
  const id = params.get("id");
  const [attempt] = useState(() => (id ? getAttempt(id) : null));

  if (!attempt) {
    return (
      <Empty
        title="Não encontramos essa prova"
        text="Ela pode ter sido feita em outro navegador ou apagada. Como não há conta, cada navegador guarda os próprios simulados."
      />
    );
  }
  if (attempt.status === "done") {
    return (
      <Empty
        title="Essa prova já foi entregue"
        text="Veja o resultado e o gabarito comentado."
        href={`/resultado?id=${attempt.id}`}
        cta="Ver resultado"
      />
    );
  }
  return (
    <Suspense fallback={<ExamSkeleton />}>
      <ExamData attempt={attempt} />
    </Suspense>
  );
}

function ExamData({ attempt }: { attempt: Attempt }) {
  const [questions, catalog, tri, pct] = use(
    once(`exam:${attempt.id}`, () =>
      Promise.all([loadQuestions(attempt.items.map((i) => i.id)), loadCatalog(), loadTri(), loadPercentiles()]),
    ),
  );
  return <ExamScreen attempt={attempt} questions={questions} catalog={catalog} tri={tri} pct={pct} />;
}

function ExamSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-line px-6">
        <LogoMark className="size-6 opacity-60" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <div className="mx-auto w-full max-w-[44rem] space-y-3 px-4 pt-12">
        <p className="mb-8 text-sm text-ink-3">Preparando sua prova…</p>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-40 w-full" />
        <div className="space-y-2.5 pt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty({ title, text, href = "/novo", cta = "Montar um simulado" }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sunken text-ink-3">
          <FileQuestion className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{text}</p>
        <ButtonLink href={href} className="mt-6">
          {cta}
        </ButtonLink>
      </div>
    </div>
  );
}
