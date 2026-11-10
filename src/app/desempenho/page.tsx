import type { Metadata } from "next";
import { Desempenho } from "@/components/Desempenho";

export const metadata: Metadata = { title: "Meu desempenho" };

export default function Pagina() {
  return <Desempenho />;
}
