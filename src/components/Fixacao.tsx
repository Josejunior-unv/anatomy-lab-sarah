"use client";
import { useMemo, useState } from "react";
import type { Questao } from "@/data/tipos";
import { correta, preparar, respondida, nomeTipo, type Resposta } from "@/lib/quiz";
import { useProgresso } from "@/store/progresso";
import { QuestaoView } from "./QuestaoView";
import { Barra, Botao, Etiqueta } from "./ui";

/** Questões de fixação com correção imediata. */
export function Fixacao({ questoes }: { questoes: Questao[] }) {
  const responder = useProgresso((s) => s.responder);
  const [rodada, setRodada] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const itens = useMemo(() => questoes.map(preparar), [questoes, rodada]);
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Resposta>(undefined);
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const fim = i >= itens.length;

  if (!itens.length) return null;
  if (fim)
    return (
      <div className="rounded-2xl bg-lilas/60 p-5 text-center">
        <p className="font-display text-lg font-bold text-tinta">
          Você acertou {acertos} de {itens.length}
        </p>
        <p className="mt-1 text-sm text-tinta-2">
          {acertos === itens.length ? "Excelente! Conteúdo bem fixado." : "Releia os pontos em que errou e tente novamente."}
        </p>
        <Botao
          className="mt-4"
          variante="secundario"
          onClick={() => {
            setI(0);
            setAcertos(0);
            setResp(undefined);
            setRevelado(false);
            setRodada((r) => r + 1);
          }}
        >
          Refazer as questões
        </Botao>
      </div>
    );

  const item = itens[i];
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Etiqueta tom="neutro">{nomeTipo[item.q.tipo]}</Etiqueta>
        <span className="text-xs font-semibold text-suave">
          Questão {i + 1} de {itens.length}
        </span>
        <Barra valor={i / itens.length} className="ml-auto max-w-32" rotulo="Andamento das questões" />
      </div>
      <QuestaoView item={item} resposta={resp} aoResponder={setResp} revelado={revelado} />
      <div className="mt-4 flex justify-end">
        {!revelado ? (
          <Botao
            disabled={!respondida(item.q, resp)}
            onClick={() => {
              const ok = correta(item.q, resp);
              responder(item.q.id, ok);
              if (ok) setAcertos((a) => a + 1);
              setRevelado(true);
            }}
          >
            Verificar resposta
          </Botao>
        ) : (
          <Botao
            onClick={() => {
              setI((x) => x + 1);
              setResp(undefined);
              setRevelado(false);
            }}
          >
            {i + 1 === itens.length ? "Ver resultado" : "Próxima questão"}
          </Botao>
        )}
      </div>
    </div>
  );
}
