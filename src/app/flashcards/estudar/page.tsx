import type { Metadata } from "next";
import { Suspense } from "react";
import { SessaoFlashcards } from "@/components/Flashcards";

export const metadata: Metadata = { title: "Estudar flashcards" };

export default function Pagina() {
  return (
    <Suspense>
      <SessaoFlashcards />
    </Suspense>
  );
}
