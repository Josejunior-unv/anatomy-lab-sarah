import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-roxo">Erro 404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-2 text-sm text-suave">Este endereço não existe no Anatomy Lab.</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-roxo px-4 py-2.5 text-sm font-semibold text-white hover:bg-roxo-forte">Voltar ao dashboard</Link>
    </div>
  );
}
