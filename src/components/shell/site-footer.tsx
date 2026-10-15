import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      {/* no celular as listas de links ficam em duas colunas: numa só, o rodapé ocupava quase uma tela inteira */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
        <div className="col-span-2 max-w-xs md:col-span-1">
          <Logo />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
            Projeto sem fins lucrativos. Gratuito, sem cadastro e sem coleta de dados. Seu progresso fica salvo só
            neste navegador.
          </p>
        </div>
        <FooterCol
          title="Estudar"
          links={[
            ["/novo", "Novo simulado"],
            ["/painel", "Seu painel"],
            ["/caderno", "Caderno de erros"],
            ["/meta", "Minha meta no SISU"],
          ]}
        />
        <FooterCol
          title="Transparência"
          links={[
            ["/metodologia", "Como a nota é calculada"],
            ["/metodologia#fontes", "Fontes dos dados"],
            ["/metodologia#privacidade", "Privacidade"],
          ]}
        />
        <FooterCol
          title="Fontes oficiais"
          links={[
            ["https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos", "Provas e gabaritos · INEP"],
            ["https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem", "Microdados do ENEM"],
            ["https://sisu.mec.gov.br", "SISU · MEC"],
            ["https://github.com/yunger7/enem-api", "enem-api (comunidade)"],
          ]}
        />
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-3 sm:px-6">
          As notas são estimativas educacionais e não substituem o resultado oficial do INEP.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink">{title}</p>
      {/* py-1 no celular: alvo de toque mais alto sem mudar o espaçamento visual do desktop */}
      <ul className="mt-2 space-y-1 md:mt-3 md:space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noreferrer" className="inline-block py-1 text-[13px] text-ink-3 hover:text-ink md:py-0">
                {label}
              </a>
            ) : (
              <Link href={href} className="inline-block py-1 text-[13px] text-ink-3 hover:text-ink md:py-0">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
