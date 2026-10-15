import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/home/builder";

export const metadata: Metadata = {
  title: "Novo simulado",
  description: "Monte um simulado do ENEM por área, por dia de prova ou por edição.",
};

export default function NovoPage() {
  return (
    <Suspense>
      <Builder />
    </Suspense>
  );
}
