-- Anatomy Lab — Sarah · estrutura do banco (Supabase / PostgreSQL)
-- Execute no SQL Editor do projeto Supabase.

create table if not exists public.progresso (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.progresso enable row level security;

create policy "progresso: leitura da própria linha"
  on public.progresso for select using (auth.uid() = user_id);
create policy "progresso: inserção da própria linha"
  on public.progresso for insert with check (auth.uid() = user_id);
create policy "progresso: atualização da própria linha"
  on public.progresso for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Armazenamento opcional de imagens e modelos 3D (GLB/GLTF) adicionais.
insert into storage.buckets (id, name, public)
  values ('modelos', 'modelos', true)
  on conflict (id) do nothing;

create policy "modelos: leitura pública"
  on storage.objects for select using (bucket_id = 'modelos');
create policy "modelos: envio por usuárias autenticadas"
  on storage.objects for insert to authenticated with check (bucket_id = 'modelos');
