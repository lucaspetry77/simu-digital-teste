import { PageShell } from "@/components/shell/page-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <p className="text-[88px] leading-none font-semibold tracking-[-0.06em] text-ink-3 tabular">404</p>
        <h1 className="mt-4 text-xl font-semibold text-ink">Essa página não caiu na prova</h1>
        <p className="mt-2 text-sm text-ink-3">O endereço pode ter mudado. Que tal voltar e treinar um pouco?</p>
        <ButtonLink href="/" className="mt-6">
          Voltar ao início
        </ButtonLink>
      </div>
    </PageShell>
  );
}
