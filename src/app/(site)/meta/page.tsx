import type { Metadata } from "next";
import { GoalSetup } from "@/components/goal/goal-setup";

export const metadata: Metadata = {
  title: "Minha meta no SISU",
  description: "Escolha um curso do SISU e acompanhe quanto falta para a nota de corte, com os pesos de cada área.",
};

export default function MetaPage() {
  return <GoalSetup />;
}
