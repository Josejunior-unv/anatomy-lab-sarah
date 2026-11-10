import type { Metadata } from "next";
import { Suspense } from "react";
import { Simulados } from "@/components/Simulados";

export const metadata: Metadata = { title: "Simulados" };

export default function Pagina() {
  return (
    <Suspense>
      <Simulados />
    </Suspense>
  );
}
