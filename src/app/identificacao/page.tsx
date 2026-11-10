import type { Metadata } from "next";
import { Identificacao } from "@/components/Identificacao";

export const metadata: Metadata = { title: "Identificação anatômica" };

export default function Pagina() {
  return <Identificacao />;
}
