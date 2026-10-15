import type { Metadata } from "next";
import { ResultPage } from "@/components/results/result-page";

export const metadata: Metadata = {
  title: "Resultado",
  robots: { index: false },
};

export default function ResultadoPage() {
  return <ResultPage />;
}
