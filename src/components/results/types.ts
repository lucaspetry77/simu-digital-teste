import type { Area, Letter } from "@/lib/areas";
import { competencia } from "@/lib/areas";
import type { Catalog, IndexItem, Question } from "@/lib/data";
import type { AnswerState, Attempt } from "@/lib/store";
import { type Difficulty, difficultyOf } from "@/lib/tri";

export type ReviewRow = {
  i: number;
  id: string;
  area: Area;
  q: Question;
  meta: IndexItem | undefined;
  ans: AnswerState | undefined;
  key: Letter | null;
  status: "ok" | "bad" | "blank" | "void";
  difficulty: Difficulty | null;
  comp: ReturnType<typeof competencia>;
  time: number;
};

export function buildRows(attempt: Attempt, questions: Question[], catalog: Catalog): ReviewRow[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return attempt.items.map(({ id, area }, i) => {
    const q = byId.get(id)!;
    const meta = catalog.byId.get(id);
    const ans = attempt.answers[id];
    const key = (attempt.keys?.[id] ?? q.answer) as Letter | null;
    const choice = ans?.choice ?? null;
    const status: ReviewRow["status"] = key == null ? "void" : !choice ? "blank" : choice === key ? "ok" : "bad";
    return {
      i,
      id,
      area,
      q,
      meta,
      ans,
      key,
      status,
      difficulty: difficultyOf(area, meta?.b, catalog),
      comp: competencia(area, meta?.skill ?? q.skill),
      time: ans?.timeSec ?? 0,
    };
  });
}
