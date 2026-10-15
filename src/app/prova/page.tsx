import type { Metadata } from "next";
import { ExamPage } from "@/components/exam/exam-page";

export const metadata: Metadata = {
  title: "Prova em andamento",
  robots: { index: false },
};

export default function ProvaPage() {
  return <ExamPage />;
}
