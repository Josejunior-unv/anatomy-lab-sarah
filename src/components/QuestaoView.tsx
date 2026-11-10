"use client";
import { Check, X } from "lucide-react";
import { correta as ehCorreta, type Item, type Resposta } from "@/lib/quiz";
import { MiniVisualizador } from "./Visualizador";
import { cx } from "./ui";

interface Props {
  item: Item;
  resposta: Resposta;
  aoResponder: (r: Resposta) => void;
  /** Quando verdadeiro, mostra o gabarito e as explicações e bloqueia a edição. */
  revelado: boolean;
}

const baseOp = "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors min-h-[48px]";

export function QuestaoView({ item, resposta, aoResponder, revelado }: Props) {
  const { q, opcoes } = item;
  const acertou = ehCorreta(q, resposta);

  const estado = (texto: string, certa: boolean) => {
    const marcada = resposta === texto;
    if (!revelado) return marcada ? "border-roxo bg-lilas text-tinta" : "border-linha bg-white hover:border-lilas-2 hover:bg-fundo";
    if (certa) return "border-ok bg-ok-fundo text-tinta";
    if (marcada) return "border-erro bg-erro-fundo text-tinta";
    return "border-linha bg-white text-tinta-2";
  };

  return (
    <div>
      {q.tipo === "ident" && (
        <div className="mb-4">
          <MiniVisualizador
            key={q.id}
            lab={q.lab}
            destaque={q.parte.split(",")}
            fantasma
            focoInicial={q.parte.split(",")}
            interativo={false}
            legenda="Gire e aproxime o modelo para examinar a estrutura em destaque."
          />
        </div>
      )}
      <p className="font-display text-lg font-bold leading-snug text-tinta">{q.p}</p>

      {(q.tipo === "mc" || q.tipo === "ident") && (
        <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Alternativas">
          {opcoes.map((texto, i) => {
            const certa = q.tipo === "mc" ? texto === q.op[0][0] : texto === q.correta;
            const explic = q.tipo === "mc" ? q.op.find((o) => o[0] === texto)?.[1] : undefined;
            return (
              <button key={texto} role="radio" aria-checked={resposta === texto} disabled={revelado} onClick={() => aoResponder(texto)} className={cx(baseOp, estado(texto, certa))}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-current/30 text-xs font-bold">
                  {revelado && certa ? <Check size={14} /> : revelado && resposta === texto ? <X size={14} /> : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{texto}</span>
                  {revelado && explic && <span className="mt-1 block text-[13px] leading-relaxed text-tinta-2">{explic}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {q.tipo === "vf" && (
        <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Verdadeiro ou falso">
          {[true, false].map((v) => {
            const marcada = resposta === v;
            const cls = !revelado
              ? marcada ? "border-roxo bg-lilas" : "border-linha bg-white hover:bg-fundo"
              : q.r === v ? "border-ok bg-ok-fundo" : marcada ? "border-erro bg-erro-fundo" : "border-linha bg-white text-tinta-2";
            return (
              <button key={String(v)} role="radio" aria-checked={marcada} disabled={revelado} onClick={() => aoResponder(v)} className={cx(baseOp, "items-center justify-center font-semibold", cls)}>
                {v ? "Verdadeiro" : "Falso"}
              </button>
            );
          })}
        </div>
      )}

      {q.tipo === "assoc" && (
        <div className="mt-4 grid gap-2">
          {q.pares.map(([esq, dir]) => {
            const r = (resposta as Record<string, string> | undefined)?.[esq] ?? "";
            const ok = r === dir;
            return (
              <label key={esq} className={cx("grid gap-2 rounded-xl border px-4 py-3 sm:grid-cols-[1fr_1.2fr] sm:items-center", revelado ? (ok ? "border-ok bg-ok-fundo" : "border-erro bg-erro-fundo") : "border-linha bg-white")}>
                <span className="text-sm font-semibold text-tinta">{esq}</span>
                <span>
                  <select
                    value={r}
                    disabled={revelado}
                    onChange={(e) => aoResponder({ ...((resposta as Record<string, string>) ?? {}), [esq]: e.target.value })}
                    className="w-full rounded-lg border border-linha bg-white px-3 py-2.5 text-sm text-tinta disabled:opacity-80"
                    aria-label={`Correspondência para ${esq}`}
                  >
                    <option value="">Selecione…</option>
                    {opcoes.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {revelado && !ok && <span className="mt-1.5 block text-[13px] text-tinta-2">Correto: <strong>{dir}</strong></span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {revelado && (
        <div className={cx("mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed", acertou ? "border-ok/40 bg-ok-fundo" : "border-erro/40 bg-erro-fundo")} role="status">
          <p className="flex items-center gap-2 font-bold text-tinta">
            {acertou ? <Check size={16} className="text-ok" /> : <X size={16} className="text-erro" />}
            {acertou ? "Resposta correta" : resposta === undefined ? "Não respondida" : "Resposta incorreta"}
          </p>
          {q.tipo === "vf" && <p className="mt-1 text-tinta-2">A afirmação é <strong>{q.r ? "verdadeira" : "falsa"}</strong>. {q.e}</p>}
          {q.tipo === "assoc" && <p className="mt-1 text-tinta-2">{q.e}</p>}
          {q.tipo === "ident" && <p className="mt-1 text-tinta-2">{q.e}</p>}
          {q.tipo === "mc" && <p className="mt-1 text-tinta-2">Veja acima a explicação de cada alternativa.</p>}
        </div>
      )}
    </div>
  );
}
