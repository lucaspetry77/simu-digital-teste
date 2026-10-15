import { PageShell } from "@/components/shell/page-shell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
