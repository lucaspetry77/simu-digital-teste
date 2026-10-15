import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { AnimIcon } from "@/components/ui/anim-icon";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Como o SIMU estima a nota TRI, de onde vêm as questões e as notas de corte, e como tratamos seus dados.",
};

const TOC = [
  ["tri", "Como a nota é estimada"],
  ["margem", "Por que existe margem de erro"],
  ["percentil", "Sua posição no Brasil"],
  ["sisu", "Comparação com o SISU"],
  ["diagnostico", "O diagnóstico do resultado"],
  ["fontes", "Fontes dos dados"],
  ["privacidade", "Privacidade"],
] as const;

export default function MetodologiaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.04em] text-balance text-ink sm:text-[44px]">
          Transparência sobre cada número
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
          O SIMU usa dados públicos e métodos conhecidos. Aqui está, sem rodeios, o que calculamos, com quais dados
          e os limites disso.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Nesta página" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-line">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[13px] text-ink-3 transition-colors hover:border-ink hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-[44rem] space-y-14 text-[15px] leading-[1.75] text-ink-2 [&_h2]:scroll-mt-24 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_p+p]:mt-4 [&_strong]:font-semibold [&_strong]:text-ink">
          <section>
            <h2 id="tri">Como a nota é estimada</h2>
            <p className="mt-4">
              O ENEM não conta acertos: ele usa a <strong>Teoria de Resposta ao Item (TRI)</strong>. Cada questão tem
              três parâmetros calibrados pelo INEP: <em>a</em> (o quanto ela diferencia quem sabe de quem não sabe),{" "}
              <em>b</em> (a dificuldade) e <em>c</em> (a chance de acerto ao acaso).
            </p>
            <p>
              Com esses parâmetros, publicados nos microdados de 2009 a 2023, calculamos a sua proficiência pelo método{" "}
              <strong>EAP</strong> (valor esperado a posteriori), partindo de uma distribuição normal e convertendo para
              a escala do ENEM (média 500, desvio 100). Questões em branco contam como erro. Itens anulados ou excluídos
              pelo INEP da calibração não entram no cálculo.
            </p>
            <Formula />
          </section>

          <section>
            <h2 id="margem">Por que existe margem de erro</h2>
            <p className="mt-4">
              Uma prova de 45 questões dá ao INEP bastante informação. Um simulado de 10 dá bem menos, e a estimativa
              fica mais perto da média, com uma faixa provável larga. Por isso sempre mostramos a faixa (intervalo de
              95%) ao lado da nota. Para uma estimativa firme, faça 30 ou mais questões de uma área.
            </p>
            <p>
              Há ainda diferenças de contexto: no dia real você faz a prova inteira, em ordem, cansado, com outra
              pressão. Trate a nota como uma bússola, não como uma previsão exata.
            </p>
          </section>

          <section>
            <h2 id="percentil">Sua posição no Brasil</h2>
            <p className="mt-4">
              O percentual de participantes com nota abaixo da sua vem da <strong>Sinopse Estatística do ENEM 2024</strong>{" "}
              (INEP), que agrupa as notas em faixas de 100 pontos. Interpolamos dentro da faixa, por isso o “≈”.
            </p>
          </section>

          <section>
            <h2 id="sisu">Comparação com o SISU</h2>
            <p className="mt-4">
              Usamos o relatório nacional do <strong>SISU 2026</strong> (MEC): 7.390 ofertas de 136 instituições, com os
              pesos de cada nota e a nota de corte da chamada regular em cada modalidade.
            </p>
            <p>
              A média projetada usa a nota mais recente de cada área nos seus simulados (com ao menos 5 itens TRI), a
              redação que você informar e, para áreas que você ainda não treinou, a média nacional, sempre sinalizada.
              Nota de corte é histórica: estar acima dela não garante vaga no próximo processo.
            </p>
          </section>

          <section>
            <h2 id="diagnostico">O diagnóstico do resultado</h2>
            <p className="mt-4">
              <strong>Dificuldade</strong>: dividimos os itens de cada área em terços pelo parâmetro <em>b</em> do INEP
              (fácil, média, difícil). <strong>Coerência</strong>: a TRI pune padrões em que você acerta difíceis e erra
              fáceis, porque eles se parecem com chute. <strong>Competências</strong>: as habilidades H1–H30 de cada item
              são agrupadas pelas competências da Matriz de Referência do ENEM. <strong>Confiança</strong>: só aparece se
              você marcar certeza, dúvida ou chute durante a prova.
            </p>
          </section>

          <section>
            <h2 id="fontes">Fontes dos dados</h2>
            <ul className="mt-4 space-y-3">
              <Source
                href="https://github.com/yunger7/enem-api"
                title="Questões: enem-api (comunidade)"
                text="2.770 questões de 2009 a 2023, conferidas com os cadernos oficiais, com figuras restauradas quando faltavam."
              />
              <Source
                href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem"
                title="Parâmetros TRI: microdados do ENEM (INEP)"
                text="Tabelas ITENS_PROVA com os parâmetros a, b, c e a habilidade de cada item."
              />
              <Source
                href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/enem"
                title="Distribuição de notas: Sinopse Estatística do ENEM 2024 (INEP)"
                text="Contagem nacional de participantes por faixa de nota em cada área."
              />
              <Source
                href="https://sisu.mec.gov.br/#/relatorio"
                title="Notas de corte: SISU 2026 (MEC)"
                text="Ofertas, pesos, notas mínimas e notas de corte da chamada regular."
              />
            </ul>
            <p className="mt-4">
              As resoluções comentadas foram escritas a partir de resoluções públicas, sempre citadas na revisão de cada
              questão. Questões anuladas ou com gabarito contestado trazem uma nota editorial.
            </p>
          </section>

          <section>
            <h2 id="privacidade">Privacidade</h2>
            <p className="mt-4">
              Não há conta, cadastro, e-mail nem rastreamento de comportamento. Seus simulados, seu caderno de erros e
              sua meta ficam no <strong>armazenamento local do seu navegador</strong> e nunca são enviados para um
              servidor. Para levar para outro aparelho, exporte um backup no{" "}
              <Link href="/painel" className="text-brand-ink underline underline-offset-2">
                painel
              </Link>
              .
            </p>
          </section>

          <div className="rounded-3xl border border-line bg-elev p-6 shadow-sm sm:p-8">
            <p className="text-[17px] font-semibold text-ink">Pronto para testar?</p>
            <p className="mt-1 text-[14px] text-ink-3">Um simulado de 15 questões leva uns 45 minutos.</p>
            <ButtonLink href="/novo" className="mt-5">
              Montar meu simulado
              <AnimIcon icon={ArrowRightIcon} size={16} />
            </ButtonLink>
          </div>
        </article>
      </div>
    </div>
  );
}

function Formula() {
  return (
    <figure className="mt-6 rounded-3xl border border-line bg-elev p-5 shadow-sm">
      <p className="text-center text-[17px] text-ink">
        P(acerto | θ) = <em>c</em> + (1 − <em>c</em>) · 1 / (1 + e<sup>−a(θ − b)</sup>)
      </p>
      <figcaption className="mt-3 text-center text-[12.5px] text-ink-3">
        Modelo logístico de 3 parâmetros. θ é a sua proficiência; a nota na escala ENEM é 500 + 100·θ.
      </figcaption>
    </figure>
  );
}

function Source({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <li>
      {/* o cartão inteiro é o link: ele sobe no hover, então qualquer ponto dele precisa funcionar */}
      <a href={href} target="_blank" rel="noreferrer" className="group lift block rounded-3xl border border-line bg-elev p-4">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink group-hover:underline">
          {title} <ExternalLink className="size-3.5 text-ink-3" />
        </span>
        <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-3">{text}</span>
      </a>
    </li>
  );
}
