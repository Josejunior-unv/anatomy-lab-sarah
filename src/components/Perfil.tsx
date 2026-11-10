"use client";
import { useEffect, useRef, useState } from "react";
import { Cloud, Download, HardDrive, LogOut, Trash2, Upload } from "lucide-react";
import { CREDITO_MODELOS, flashcards, questoes, topicos } from "@/data";
import { formatarTempo } from "@/lib/datas";
import { cardsRevisados, progressoGeral, sequencia, tempoTotal } from "@/lib/estatisticas";
import { supabase, supabaseConfigurado } from "@/lib/supabase";
import { dadosIniciais, extrairDados, useProgresso, type Dados, type Metas } from "@/store/progresso";
import { Botao, Cabecalho, Cartao, Etiqueta } from "./ui";

const campo = "mt-1.5 block w-full rounded-xl border border-linha bg-white px-3 py-2.5 text-sm text-tinta outline-none focus:border-roxo";

function Conta() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [usuario, setUsuario] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUsuario(data.session?.user.email ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setUsuario(s?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigurado)
    return (
      <div>
        <Etiqueta tom="agua"><HardDrive size={13} /> Modo local</Etiqueta>
        <p className="mt-3 text-sm leading-relaxed text-tinta-2">
          Seu progresso está sendo salvo automaticamente <strong>neste navegador</strong> e é preservado entre sessões. Para acessar de outros aparelhos, conecte um projeto Supabase: defina <code className="rounded bg-fundo-2 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="rounded bg-fundo-2 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e execute <code className="rounded bg-fundo-2 px-1 py-0.5 text-xs">supabase/schema.sql</code> (passo a passo no README). Enquanto isso, use o backup abaixo para levar seus dados.
        </p>
      </div>
    );

  const entrar = async (criar: boolean) => {
    const sb = supabase()!;
    setOcupado(true);
    setMsg(null);
    const { data, error } = criar ? await sb.auth.signUp({ email, password: senha }) : await sb.auth.signInWithPassword({ email, password: senha });
    setOcupado(false);
    if (error) setMsg({ ok: false, t: error.message });
    else if (criar && !data.session) setMsg({ ok: true, t: "Conta criada. Confirme o e-mail recebido e depois entre." });
    else setMsg({ ok: true, t: "Tudo certo! Seu progresso será sincronizado." });
  };

  if (usuario)
    return (
      <div>
        <Etiqueta tom="ok"><Cloud size={13} /> Sincronização ativa</Etiqueta>
        <p className="mt-3 text-sm text-tinta-2">Conectada como <strong>{usuario}</strong>. O progresso é enviado à nuvem a cada alteração.</p>
        <Botao variante="fantasma" className="mt-4" onClick={() => supabase()!.auth.signOut()}><LogOut size={16} /> Sair</Botao>
      </div>
    );

  return (
    <form onSubmit={(e) => { e.preventDefault(); entrar(false); }} className="grid gap-3 sm:max-w-sm">
      <p className="text-sm text-tinta-2">Entre para salvar seu progresso na nuvem e continuar em qualquer aparelho.</p>
      <label className="text-sm font-semibold">E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} /></label>
      <label className="text-sm font-semibold">Senha<input type="password" required minLength={6} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} /></label>
      {msg && <p role="status" className={msg.ok ? "text-sm text-ok" : "text-sm text-erro"}>{msg.t}</p>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" disabled={ocupado}>Entrar</Botao>
        <Botao type="button" variante="secundario" disabled={ocupado || !email || senha.length < 6} onClick={() => entrar(true)}>Criar conta</Botao>
      </div>
    </form>
  );
}

export function Perfil() {
  const s = useProgresso();
  const arquivo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; t: string } | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  const exportar = () => {
    const blob = new Blob([JSON.stringify(extrairDados(useProgresso.getState()), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `anatomy-lab-sarah-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setAviso({ ok: true, t: "Backup baixado." });
  };
  const importar = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as Partial<Dados>;
      if (!d || typeof d !== "object" || !d.cards || !d.dias || !d.perfil) throw new Error();
      s.substituir({ ...dadosIniciais(), ...d, atualizadoEm: Date.now() } as Dados);
      setAviso({ ok: true, t: "Backup restaurado com sucesso." });
    } catch {
      setAviso({ ok: false, t: "Arquivo inválido: escolha um backup gerado pelo Anatomy Lab." });
    }
  };
  const meta = (k: keyof Metas, rotulo: string, passo: number, max: number) => (
    <label className="text-sm font-semibold text-tinta">
      {rotulo}
      <input type="number" min={0} max={max} step={passo} value={s.metas[k]} onChange={(e) => s.setMetas({ [k]: Math.max(0, Math.min(max, Number(e.target.value) || 0)) })} className={campo} />
    </label>
  );

  return (
    <>
      <Cabecalho sobre="Conta" titulo="Meu perfil" descricao="Seus dados, metas semanais e onde o progresso fica guardado." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao>
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-roxo to-petroleo font-display text-2xl font-extrabold text-white">{(s.perfil.nome || "S").slice(0, 1).toUpperCase()}</span>
            <div>
              <p className="font-display text-xl font-extrabold">{s.perfil.nome || "Sarah"}</p>
              <p className="text-sm text-suave">{[s.perfil.curso, s.perfil.instituicao].filter(Boolean).join(" · ") || "Estudante de anatomia"}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">Nome<input value={s.perfil.nome} onChange={(e) => s.setPerfil({ nome: e.target.value })} className={campo} autoComplete="given-name" /></label>
            <label className="text-sm font-semibold">Curso<input value={s.perfil.curso} onChange={(e) => s.setPerfil({ curso: e.target.value })} placeholder="Ex.: Medicina" className={campo} /></label>
            <label className="text-sm font-semibold">Instituição<input value={s.perfil.instituicao} onChange={(e) => s.setPerfil({ instituicao: e.target.value })} className={campo} /></label>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Progresso", `${Math.round(progressoGeral(s) * 100)}%`], ["Sequência", `${sequencia(s.dias)} d`], ["Revisões", cardsRevisados(s.dias)], ["Tempo", formatarTempo(tempoTotal(s.dias))]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-fundo px-3 py-2.5">
                <dt className="text-xs font-semibold text-suave">{k}</dt>
                <dd className="font-display text-base font-extrabold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Cartao>

        <Cartao id="metas" className="scroll-mt-24">
          <h2 className="text-lg font-bold">Metas semanais</h2>
          <p className="mt-1 text-sm text-suave">Aparecem no dashboard e são zeradas toda segunda-feira.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {meta("cards", "Flashcards revisados", 10, 2000)}
            {meta("minutos", "Minutos de estudo", 30, 6000)}
            {meta("topicos", "Conteúdos estudados", 1, 67)}
            {meta("simulados", "Simulados concluídos", 1, 50)}
          </div>
        </Cartao>

        <Cartao>
          <h2 className="mb-3 text-lg font-bold">Conta e sincronização</h2>
          <Conta />
        </Cartao>

        <Cartao>
          <h2 className="text-lg font-bold">Backup dos dados</h2>
          <p className="mt-1 text-sm text-suave">Baixe um arquivo com todo o seu progresso ou restaure um backup anterior.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao variante="secundario" onClick={exportar}><Download size={16} /> Baixar backup</Botao>
            <Botao variante="fantasma" onClick={() => arquivo.current?.click()}><Upload size={16} /> Restaurar backup</Botao>
            <input ref={arquivo} type="file" accept="application/json,.json" className="sr-only" aria-label="Arquivo de backup" onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ""; }} />
          </div>
          {aviso && <p role="status" className={`mt-3 text-sm ${aviso.ok ? "text-ok" : "text-erro"}`}>{aviso.t}</p>}
          <div className="mt-6 border-t border-linha pt-4">
            {confirmar ? (
              <div className="rounded-xl bg-erro-fundo p-4" role="alertdialog" aria-label="Confirmar exclusão do progresso">
                <p className="text-sm font-semibold text-tinta">Apagar todo o progresso? Flashcards, simulados, tempo e metas voltam ao início. Esta ação não pode ser desfeita.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao variante="perigo" className="!bg-erro !text-white" onClick={() => { s.resetar(); setConfirmar(false); setAviso({ ok: true, t: "Progresso apagado." }); }}>Sim, apagar tudo</Botao>
                  <Botao variante="fantasma" className="bg-white" onClick={() => setConfirmar(false)}>Cancelar</Botao>
                </div>
              </div>
            ) : (
              <Botao variante="perigo" onClick={() => setConfirmar(true)}><Trash2 size={16} /> Apagar todo o progresso</Botao>
            )}
          </div>
        </Cartao>
      </div>

      <Cartao className="mt-5">
        <h2 className="text-lg font-bold">Sobre o Anatomy Lab</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta-2">
          {topicos.length} conteúdos, {flashcards.length} flashcards e {questoes.length} questões escritas, além de questões de identificação geradas a partir dos modelos 3D. A nomenclatura segue a Terminologia Anatômica em português. Este é um material de apoio ao estudo: use-o junto com o atlas e a bibliografia indicados pelo seu curso.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-suave">Modelos 3D: {CREDITO_MODELOS}.</p>
      </Cartao>
    </>
  );
}
