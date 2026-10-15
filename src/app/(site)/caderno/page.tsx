import type { Metadata } from "next";
import { Notebook } from "@/components/home/notebook";

export const metadata: Metadata = {
  title: "Caderno de erros",
  description: "Questões que você errou, deixou em branco ou acertou no chute, prontas para refazer.",
};

export default function CadernoPage() {
  return <Notebook />;
}
