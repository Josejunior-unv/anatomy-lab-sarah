"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flame, Target, X } from "lucide-react";
import { gerarIdent, modelos, type LabId, type ModoIdent, type QIdent } from "@/data";
import { useProgresso } from "@/store/progresso";
import { MiniVisualizador } from "./Visualizador";
import { Botao, Cabecalho, Cartao, cx } from "./ui";

const MODOS: Record<LabId, { id: ModoIdent; titulo: string; texto: string }[]> = {
  esqueleto: [
    { id: "estrutura", titulo: "Qual é o osso?", texto: "Um osso é destacado no esqueleto." },
    { id: "acidente", titulo: "Qual é o acidente anatômico?", texto: "Reconheça o osso e aponte um acidente que pertence a ele." },
    { id: "regiao", titulo: "Qual é a região?", texto: "Indique a região do esqueleto a que o osso pertence." },
  ],
  encefalo: [
    { id: "estrutura", titulo: "Qual é a estrutura?", texto: "Uma estrutura do encéfalo é destacada." },
    { id: "regiao", titulo: "Qual é a região?", texto: "Indique o lobo ou a divisão a que a estrutura pertence." },
  ],
};

export function Identificacao() {
  const registrar = useProgresso((s) => s.registrarIdent);
  const visitar = useProgresso((s) => s.visitar);
  const totais = useProgresso((s) => s.ident);
  const [lab, setLab] = useState<LabId>("esqueleto");
  const [modo, setModo] = useState<ModoIdent>("estrutura");
  const [q, setQ] = useState<QIdent | null>(null);
  const [resp, setResp] = useState<string | null>(null);
  const [sessao, setSessao] = useState({ t: 0, c: 0, seq: 0 });
  const recentes = useRef<string[]>([]);

  const proxima = useCallback(
    (l: LabId, m: ModoIdent) => {
      const nova = gerarIdent(l, m, new Set(recentes.current));
      if (nova) recentes.current = [...recentes.current, m === "acidente" ? nova.topico : nova.correta].slice(-8);
      setQ(nova);
      setResp(null);
    },
    [],
  );

  useEffect(() => {
    visitar({ tipo: "identificacao", id: "ident", titulo: "Identificação anatômica", href: "/identificacao" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    recentes.current = [];
    proxima(lab, modo);
  }, [lab, modo, proxima]);

  const responder = (o: string) => {
    if (!q || resp) return;
    const ok = o === q.correta;
    setResp(o);
    registrar(q.d, ok);
    setSessao((s) => ({ t: s.t + 1, c: s.c + (ok ? 1 : 0), seq: ok ? s.seq + 1 : 0 }));
  };
  const trocarLab = (l: LabId) => {
    setLab(l);
    if (!MODOS[l].some((m) => m.id === modo)) setModo("estrutura");
  };
  const disc = modelos[lab].disciplina;
  const acerto = resp !== null && q !== null && resp === q.correta;

  return (
    <>
      <Cabecalho
        sobre="Treino visual"
        titulo="Identificação anatômica"
        descricao="Uma estrutura aparece destacada em verde no modelo 3D. Gire, aproxime e responda — a explicação vem logo em seguida."
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl border border-linha bg-white p-1" role="tablist" aria-label="Disciplina">
          {(["esqueleto", "encefalo"] as LabId[]).map((l) => (
            <button key={l} role="tab" aria-selected={lab === l} onClick={() => trocarLab(l)} className={cx("rounded-xl px-4 py-2 text-sm font-semibold", lab === l ? "bg-roxo text-white" : "text-tinta-2 hover:bg-fundo-2")}>
              {l === "esqueleto" ? "Osteologia" : "Neuroanatomia"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold tabular-nums text-tinta"><Target size={15} className="text-petroleo" /> {sessao.c}/{sessao.t} nesta sessão</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold tabular-nums text-tinta"><Flame size={15} className="text-[#e0a23a]" /> {sessao.seq} em sequência</span>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {MODOS[lab].map((m) => (
          <button key={m.id} onClick={() => setModo(m.id)} aria-pressed={modo === m.id} className={cx("rounded-2xl border p-4 text-left transition-colors", modo === m.id ? "border-roxo bg-lilas" : "border-linha bg-white hover:bg-fundo")}>
            <span className="block font-display text-sm font-bold text-tinta">{m.titulo}</span>
            <span className="mt-0.5 block text-xs text-suave">{m.texto}</span>
          </button>
        ))}
      </div>

      {q && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <MiniVisualizador key={q.id} lab={q.lab} destaque={q.parte.split(",")} fantasma focoInicial={q.parte.split(",")} interativo={false} altura="h-[48dvh] min-h-[340px] lg:h-[560px]" legenda="Estrutura em destaque (verde)" />
          <Cartao className="self-start">
            <p className="font-display text-xl font-bold leading-snug text-tinta">{q.p}</p>
            <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Alternativas">
              {q.op.map((o, i) => {
                const certa = o === q.correta;
                const cls = resp === null
                  ? "border-linha bg-white hover:border-lilas-2 hover:bg-fundo"
                  : certa ? "border-ok bg-ok-fundo" : resp === o ? "border-erro bg-erro-fundo" : "border-linha bg-white text-tinta-2";
                return (
                  <button key={o} role="radio" aria-checked={resp === o} disabled={resp !== null} onClick={() => responder(o)} className={cx("flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors", cls)}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current/30 text-xs font-bold">
                      {resp !== null && certa ? <Check size={14} /> : resp === o ? <X size={14} /> : String.fromCharCode(65 + i)}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
            {resp !== null && (
              <div className={cx("mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed", acerto ? "border-ok/40 bg-ok-fundo" : "border-erro/40 bg-erro-fundo")} role="status">
                <p className="font-bold text-tinta">{acerto ? "Correto!" : `Resposta correta: ${q.correta}`}</p>
                <p className="mt-1 text-tinta-2">{q.e}</p>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-suave">
                Total em {disc === "ossea" ? "osteologia" : "neuroanatomia"}: {totais[disc].c}/{totais[disc].t} acertos
              </p>
              <Botao disabled={resp === null} onClick={() => proxima(lab, modo)}>Próxima <ArrowRight size={16} /></Botao>
            </div>
          </Cartao>
        </div>
      )}
    </>
  );
}
