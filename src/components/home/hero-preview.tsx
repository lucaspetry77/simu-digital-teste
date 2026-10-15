import { Bookmark, CircleCheck, CircleHelp, Dices, Highlighter, Strikethrough, Target, Timer, Wind } from "lucide-react";
import { AreaIcon } from "@/components/ui/area-icon";

/**
 * Prévia do produto montada em HTML (não é imagem): a prova em modo foco com o
 * resultado e a meta sobrepostos. Puramente ilustrativa.
 */
export function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl select-none" aria-hidden>
      {/* brilho de fundo */}
      <div className="absolute inset-x-10 -top-10 h-64 rounded-full bg-brand/15 blur-3xl" />

      {/* Janela da prova */}
      <div className="relative overflow-hidden rounded-[22px] border border-line bg-elev shadow-lg">
        <div className="flex h-11 items-center gap-3 border-b border-line px-4">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </span>
          <AreaIcon area="MT" size="sm" className="ml-2" play />
          <span className="text-[12px] font-medium text-ink">Matemática · edições variadas</span>
          <span className="ml-auto hidden items-center gap-3 text-[11.5px] text-ink-3 sm:flex">
            <span className="flex items-center gap-1 rounded-full bg-hl/60 px-1.5 py-0.5 text-ink">
              <Highlighter className="size-3" /> Marca-texto
            </span>
            <span className="flex items-center gap-1">
              <Wind className="size-3" /> Respirar
            </span>
            <span className="flex items-center gap-1 font-medium text-ok">
              <span className="size-1.5 rounded-full bg-ok" /> No ritmo
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-line px-2 py-1 font-mono text-[12px] text-ink">
              <Timer className="size-3 text-ink-3" /> 31:42
            </span>
          </span>
        </div>
        <div className="h-[3px] w-[46%] bg-brand" />

        <div className="grid grid-cols-1 gap-8 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_200px]">
          <div>
            <div className="flex items-center justify-between text-[11.5px] text-ink-3">
              <span>
                <span className="font-mono font-medium text-ink">07</span>/15 · ENEM 2022 · questão 151
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="size-3.5" /> Revisar depois
              </span>
            </div>
            <p className="mt-4 text-[14.5px] leading-[1.75] text-ink">
              Uma loja vende um produto por R$ 180,00. Na promoção, o preço é{" "}
              <span className="rounded-[3px] bg-hl/70 px-0.5">reduzido em 15%</span> e, para pagamentos à vista,{" "}
              <span className="rounded-[3px] bg-hl/70 px-0.5">há um desconto adicional de 10%</span> sobre o novo preço.
            </p>
            <p className="mt-3 text-[14.5px] leading-[1.75] font-medium text-ink">
              Qual o valor pago à vista por esse produto?
            </p>
            <div className="mt-5 space-y-2">
              {[
                ["A", "R$ 135,00", "x"],
                ["B", "R$ 137,70", "sel"],
                ["C", "R$ 144,00", ""],
                ["D", "R$ 153,00", "x"],
              ].map(([l, t, s]) => (
                <div
                  key={l}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    s === "sel"
                      ? "border-brand bg-brand-softer shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_14%,transparent)]"
                      : "border-line"
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full border text-[11px] font-medium ${
                      s === "sel" ? "border-brand bg-brand text-white" : "border-line-strong text-ink-3"
                    }`}
                  >
                    {l}
                  </span>
                  <span
                    className={`text-[13.5px] ${s === "x" ? "text-ink-3 line-through opacity-50" : "text-ink"}`}
                  >
                    {t}
                  </span>
                  {s === "x" ? <Strikethrough className="ml-auto size-3.5 text-ink-3" /> : null}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-sunken/60 p-2 text-[11.5px]">
              <span className="px-1 text-ink-3">Quão confiante?</span>
              <span className="flex items-center gap-1 rounded-full border border-line-strong bg-elev px-2 py-1 font-medium text-ink shadow-sm">
                <CircleCheck className="size-3.5 text-ok" /> Certeza
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-ink-3">
                <CircleHelp className="size-3.5" /> Dúvida
              </span>
              <span className="flex items-center gap-1 px-2 py-1 text-ink-3">
                <Dices className="size-3.5" /> Chute
              </span>
            </div>
          </div>

          <div className="hidden md:block">
            <p className="text-[11.5px] font-medium text-ink">Cartão-resposta</p>
            <div className="mt-2.5 grid grid-cols-5 gap-1">
              {Array.from({ length: 15 }, (_, i) => {
                const answered = i < 7;
                const letters = "CEABDBB";
                return (
                  <span
                    key={i}
                    className={`relative grid h-8 place-items-center rounded-full font-mono text-[10px] ${
                      answered ? "bg-ink text-inverse" : "border border-line text-ink-3"
                    } ${i === 6 ? "ring-2 ring-brand ring-offset-1 ring-offset-elev" : ""}`}
                  >
                    {answered ? letters[i] : i + 1}
                    {i === 3 ? <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-warn" /> : null}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Resultado flutuante */}
      <div className="absolute -right-2 -bottom-10 hidden w-[264px] rounded-2xl border border-line bg-elev p-4 shadow-lg sm:block lg:-right-10">
        <p className="text-[12px] font-medium text-ink-3">Nota TRI estimada</p>
        <p className="mt-1 text-[44px] leading-none font-semibold tracking-[-0.045em] text-ink tabular">
          712<span className="text-ink-3">,4</span>
        </p>
        <div className="mt-3 flex h-10 items-end gap-[3px]">
          {[6, 14, 30, 62, 92, 74, 48, 26, 12, 5].map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t-[3px] ${i === 7 ? "bg-brand" : i < 7 ? "bg-brand/25" : "bg-sunken"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <p className="mt-2 text-[12px] text-ink-2">
          Melhor que <strong className="font-medium text-ink">≈ 86%</strong> dos participantes
        </p>
      </div>

      {/* Meta flutuante */}
      <div className="absolute -bottom-6 -left-2 hidden items-center gap-3 rounded-2xl border border-line bg-elev py-3 pr-4 pl-3 shadow-lg md:flex lg:-left-10">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-ink">
          <Target className="size-[18px]" />
        </span>
        <span>
          <span className="block text-[11.5px] text-ink-3">Engenharia Civil · UFPR</span>
          <span className="block text-[13px] font-medium text-ink">Faltam 18 pontos na média</span>
        </span>
      </div>
    </div>
  );
}
