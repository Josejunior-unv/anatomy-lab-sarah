"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { extrairDados, useProgresso, type Dados } from "@/store/progresso";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = !!(url && chave);

let cliente: SupabaseClient | null = null;
export const supabase = (): SupabaseClient | null => {
  if (!supabaseConfigurado) return null;
  if (!cliente) cliente = createClient(url!, chave!);
  return cliente;
};

export type EstadoSync = "local" | "deslogado" | "sincronizando" | "sincronizado" | "erro";

/** Envia o progresso atual para a tabela `progresso` (uma linha por usuária). */
export async function enviar(userId: string): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const dados = extrairDados(useProgresso.getState());
  const { error } = await sb
    .from("progresso")
    .upsert({ user_id: userId, dados, atualizado_em: new Date(dados.atualizadoEm || Date.now()).toISOString() });
  return !error;
}

/** Busca o progresso remoto e mantém a versão mais recente (local ou nuvem). */
export async function reconciliar(userId: string): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const { data, error } = await sb.from("progresso").select("dados").eq("user_id", userId).maybeSingle();
  if (error) return false;
  const remoto = data?.dados as Dados | undefined;
  const local = useProgresso.getState();
  if (remoto && (remoto.atualizadoEm ?? 0) > local.atualizadoEm) {
    useProgresso.getState().substituir(remoto);
    return true;
  }
  return enviar(userId);
}
