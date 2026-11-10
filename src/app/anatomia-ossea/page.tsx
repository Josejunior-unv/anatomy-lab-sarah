import type { Metadata } from "next";
import { ListaTopicos } from "@/components/Topicos";

export const metadata: Metadata = { title: "Anatomia óssea" };

export default function Pagina() {
  return <ListaTopicos disciplina="ossea" />;
}
