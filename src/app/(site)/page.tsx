import Link from "next/link";
import { CircleCheck, CircleHelp, Dices, Strikethrough } from "lucide-react";
import { InViewTitle } from "@/components/arc/in-view-title/in-view-title";
import { FeatureCard, HoverRow } from "@/components/home/feature-card";
import { HeroBadge } from "@/components/home/hero-badge";
import { HeroPreview } from "@/components/home/hero-preview";
import { QuickStartButton, QuickStartCards } from "@/components/home/quick-start";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { BookTextIcon } from "@/components/icons/book-text";
import { ChartColumnIncreasingIcon } from "@/components/icons/chart-column-increasing";
import { CompassIcon } from "@/components/icons/compass";
import { DatabaseBackupIcon } from "@/components/icons/database-backup";
import { FileCheckIcon } from "@/components/icons/file-check";
import { GaugeIcon } from "@/components/icons/gauge";
import { LockIcon } from "@/components/icons/lock";
import { PenToolIcon } from "@/components/icons/pen-tool";
import { TimerIcon } from "@/components/icons/timer";
import { UserIcon } from "@/components/icons/user";
import { AnimIcon } from "@/components/ui/anim-icon";
import { AreaIcon } from "@/components/ui/area-icon";
import { ButtonLink } from "@/components/ui/button";
import { AREA_META, AREAS } from "@/lib/areas";

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="paper relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-28 sm:px-6 sm:pt-20 sm:pb-36">
          <div className="mx-auto max-w-3xl text-center">
            <HeroBadge />
            <h1 className="mt-7 text-[40px] leading-[1.04] font-semibold tracking-[-0.045em] text-balance text-ink sm:text-[60px]">
              Treine com o ENEM de verdade e descubra <span className="text-brand">quanto falta</span> para a sua vaga.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16.5px] leading-relaxed text-pretty text-ink-2">
              2.770 questões oficiais de 2009 a 2023, nota estimada pela TRI com os parâmetros do INEP e comparação
              com as notas de corte do SISU 2026.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/novo" size="lg" className="w-full sm:w-auto">
                Montar meu simulado
                <AnimIcon icon={ArrowRightIcon} size={18} />
              </ButtonLink>
              <QuickStartButton presetKey="rapido" variant="secondary" className="w-full sm:w-auto">
                Aquecimento de 12 questões
              </QuickStartButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
              {AREAS.map((a) => (
                <span key={a} className="flex items-center gap-1.5">
                  <AreaIcon area={a} size="sm" />
                  {AREA_META[a].short}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-16 sm:mt-20">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ── Atalhos ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <InViewTitle text="Escolha um treino e comece" className="text-[28px] font-semibold tracking-[-0.03em] text-ink" />
          <p className="max-w-sm text-[14px] text-ink-3">
            Sem formulário e sem e-mail. A prova abre na hora e fica salva neste navegador.
          </p>
        </div>
        <div className="mt-8">
          <QuickStartCards />
        </div>
      </section>

      {/* ── Diferenciais ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <InViewTitle
            text="Cada simulado te devolve um próximo passo."
            className="text-[32px] leading-tight font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[40px]"
          />
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">
            Uma nota sozinha não diz o que estudar amanhã. O SIMU observa como você responde (com que certeza, em que
            ritmo, em que tipo de questão) e transforma isso em orientação.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <FeatureCard
            className="md:col-span-3"
            icon={CompassIcon}
            title="Sua meta no SISU como bússola"
            text="Escolha o curso dos seus sonhos entre 7.390 ofertas. A cada simulado você vê quanto falta e em qual área cada ponto vale mais, pelos pesos da própria universidade."
          >
            <div className="mt-6 space-y-2.5 rounded-2xl border border-line bg-sunken/60 p-4">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-ink">Medicina · UFPE</span>
                <span className="text-ink-3">corte 809,1 (ampla)</span>
              </div>
              {(
                [
                  ["CN", 3, 74],
                  ["MT", 2, 81],
                  ["LC", 2, 70],
                  ["CH", 1, 66],
                ] as const
              ).map(([a, w, v]) => (
                <div key={a} className="flex items-center gap-3 text-[12px]">
                  <span className="w-20 text-ink-2">{AREA_META[a].short}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-elev">
                    <span className="block h-full rounded-full" style={{ width: `${v}%`, background: AREA_META[a].color }} />
                  </span>
                  <span className="w-12 text-right text-ink-3 tabular">peso {w}</span>
                </div>
              ))}
              <p className="pt-1 text-[12px] text-ink-2">
                <span className="font-medium text-ink">Natureza rende 3×</span> mais que Humanas para essa vaga.
              </p>
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-3"
            icon={GaugeIcon}
            title="Termômetro de confiança"
            text="Depois de marcar, diga se teve certeza, dúvida ou chutou. O resultado mostra onde sua intuição é boa e quais acertos de sorte ainda precisam de estudo."
          >
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: CircleCheck, label: "certeza", pct: 88, tone: "var(--ok)" },
                { icon: CircleHelp, label: "dúvida", pct: 54, tone: "var(--warn)" },
                { icon: Dices, label: "chute", pct: 23, tone: "var(--bad)" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-line bg-sunken/60 p-3">
                  <c.icon className="size-4" style={{ color: c.tone }} />
                  <p className="mt-3 text-xl font-semibold text-ink tabular">{c.pct}%</p>
                  <p className="text-[11.5px] text-ink-3">acertos com {c.label}</p>
                </div>
              ))}
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-2"
            icon={PenToolIcon}
            title="Como no papel"
            text="Marca-texto para destacar o enunciado e risco nas alternativas que você já descartou. As mesmas táticas da prova impressa."
          >
            <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
              …o preço é <span className="rounded-[3px] bg-hl/70 px-0.5 text-ink">reduzido em 15%</span> e…
            </p>
            <p className="mt-2 flex items-center gap-2 text-[13.5px] text-ink-3 line-through opacity-60">
              <Strikethrough className="size-3.5" /> R$ 153,00
            </p>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-2"
            icon={TimerIcon}
            title="Ritmo, sem pânico"
            text="Um aviso gentil de ritmo (3 minutos por questão), opção de esconder o relógio e uma pausa guiada de respiração no meio da prova."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={BookTextIcon}
            title="Caderno de erros"
            text="Erros, questões em branco e acertos no chute viram uma lista para refazer. Acertou de novo? Ela sai do caderno."
          />
          <FeatureCard
            className="md:col-span-3"
            icon={ChartColumnIncreasingIcon}
            title="TRI explicada, sem mistério"
            text="Você vê o nível de dificuldade de cada questão e se suas respostas foram coerentes. Errar as fáceis e acertar as difíceis derruba a nota. Agora você sabe por quê."
          />
          <FeatureCard
            className="md:col-span-3"
            icon={FileCheckIcon}
            title="Gabarito que ensina"
            text="Resolução comentada e o porquê de cada alternativa estar errada, com as fontes consultadas. Questões anuladas ou contestadas vêm sinalizadas."
          />
        </div>
      </section>

      {/* ── Como a nota é calculada ─────────────────────────────────── */}
      <section className="border-y border-line bg-elev">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <InViewTitle
              text="Uma estimativa honesta, com dados públicos."
              className="text-[30px] leading-tight font-semibold tracking-[-0.03em] text-ink"
            />
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              A nota usa o mesmo modelo do INEP (TRI de 3 parâmetros) com os parâmetros oficiais de cada item. É uma
              estimativa: provas curtas têm margem de erro maior, e sempre mostramos essa margem.
            </p>
            <Link
              href="/metodologia"
              className="group mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-ink hover:underline"
            >
              Ler a metodologia completa
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <ol className="grid gap-3">
            {[
              ["Você responde", "Questões oficiais do INEP, com figuras e fórmulas restauradas e revisadas."],
              [
                "Estimamos sua TRI",
                "Modelo 3PL com os parâmetros a, b e c publicados nos microdados do ENEM 2009 a 2023.",
              ],
              [
                "Comparamos com o Brasil",
                "Sua posição entre os 3 milhões de participantes do ENEM 2024 e as notas de corte do SISU 2026.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="lift flex gap-4 rounded-2xl border border-line bg-bg p-5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand-ink tabular">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink">{t}</span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-3">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── História ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <figure>
            <blockquote className="text-[30px] leading-[1.18] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[40px]">
              “Criei um site de simulados do ENEM pra ajudar minha irmã nos estudos.”
            </blockquote>
            <figcaption className="mt-6 text-[14px] leading-relaxed text-ink-2">
              O SIMU começou assim: um irmão ajudando a irmã. Ela gostou, ele comprou um domínio e abriu para todo
              mundo. E continua assim, sem fins lucrativos.
              <span className="mt-3 block text-ink-3">
                “Achei esse um melhor uso da IA do que tentar provar a hipótese de Riemann.”
              </span>
            </figcaption>
          </figure>
          <div className="grid gap-3">
            <HoverRow icon={UserIcon} title="Sem conta" text="Não pedimos e-mail, nome ou telefone. Você só estuda." />
            <HoverRow
              icon={LockIcon}
              title="Seus dados ficam com você"
              text="Progresso salvo só neste navegador. Exporte quando quiser."
            />
            <HoverRow icon={DatabaseBackupIcon} title="Dados abertos" text="INEP, MEC e a comunidade enem-api. Tudo citado." />
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center sm:px-12">
          <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
          <div className="relative">
            <InViewTitle
              text="Um simulado pode levar só 15 minutos."
              className="text-[30px] leading-tight font-semibold tracking-[-0.03em] text-balance !text-inverse sm:text-[40px]"
            />
          </div>
          <p className="relative mx-auto mt-3 max-w-md text-[15px] text-inverse/70">
            Comece pequeno. O importante é saber onde você está e o que estudar em seguida.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/novo" size="lg">
              Montar meu simulado
              <AnimIcon icon={ArrowRightIcon} size={18} />
            </ButtonLink>
            <ButtonLink href="/meta" size="lg" variant="ghost" className="text-inverse/80 hover:bg-inverse/10 hover:text-inverse">
              <AnimIcon icon={CompassIcon} size={18} />
              Definir minha meta
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
