import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalheTopico } from "@/components/Topicos";
import { topicos } from "@/data";

const lista = topicos.filter((t) => t.disciplina === "neuro");

export const dynamicParams = false;
export const generateStaticParams = () => lista.map((t) => ({ id: t.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: lista.find((t) => t.id === id)?.titulo ?? "Neuroanatomia" };
}

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!lista.some((t) => t.id === id)) notFound();
  return <DetalheTopico id={id} />;
}
