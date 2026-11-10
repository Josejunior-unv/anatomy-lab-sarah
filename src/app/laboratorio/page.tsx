import type { Metadata } from "next";
import { Suspense } from "react";
import { Laboratorio } from "@/components/Laboratorio";

export const metadata: Metadata = { title: "Laboratório 3D" };

export default function Pagina() {
  return (
    <Suspense>
      <Laboratorio />
    </Suspense>
  );
}
