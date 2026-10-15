import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/components/arc/foundation.css";
import "./globals.css";
import { Providers } from "@/components/shell/providers";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "SIMU · Simulados do ENEM com nota TRI",
    template: "%s · SIMU",
  },
  description:
    "Simulados gratuitos com 2.770 questões oficiais do ENEM (2009 a 2023), nota estimada pela TRI e comparação com as notas de corte do SISU. Sem cadastro e sem coletar seus dados.",
  applicationName: "SIMU",
  openGraph: {
    title: "SIMU · Simulados do ENEM com nota TRI",
    description: "Questões oficiais, nota TRI estimada e notas de corte do SISU. Grátis e sem cadastro.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e12" },
  ],
};

// Aplica tema e preferências de leitura antes da primeira pintura (sem flash).
const prefsScript = `(function(){try{var p=JSON.parse(localStorage.getItem("simu:prefs")||"{}");var t=p.theme||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var d=document.documentElement;d.setAttribute("data-theme",t);if(p.readingSize)d.style.setProperty("--reading-size",p.readingSize+"px")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
