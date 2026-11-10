import type { Metadata } from "next";
import { PainelFlashcards } from "@/components/Flashcards";

export const metadata: Metadata = { title: "Flashcards" };

export default function Pagina() {
  return <PainelFlashcards />;
}
