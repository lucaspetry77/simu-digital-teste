import type { Metadata } from "next";
import { Dashboard } from "@/components/home/dashboard";

export const metadata: Metadata = {
  title: "Seu painel",
  description: "Histórico de simulados, evolução da nota TRI e progresso até a sua meta no SISU.",
};

export default function PainelPage() {
  return <Dashboard />;
}
