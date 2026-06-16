-- =====================================================================
-- Recebimento Provisório - Anexo III
-- Cole tudo isto no Supabase → SQL Editor → Run.
--
-- O app acessa o banco SOMENTE via service_role (server-side), então
-- deixamos o RLS ligado SEM políticas: ninguém entra com a anon key.
-- =====================================================================

create extension if not exists pgcrypto;

-- Emails autorizados a entrar (login só por email, sem senha) -----------
create table if not exists usuarios_permitidos (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  nome       text,
  is_admin   boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- Obras em recebimento --------------------------------------------------
create table if not exists obras (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  descricao  text,
  criado_em  timestamptz not null default now()
);

-- Registros fotográficos (foto comprimida guardada como dataURL) --------
create table if not exists registros (
  id           uuid primary key default gen_random_uuid(),
  obra_id      uuid not null references obras(id) on delete cascade,
  autor_email  text not null,
  descricao    text not null,
  foto_data    text not null,
  criado_em    timestamptz not null default now()
);

create index if not exists registros_obra_autor_idx
  on registros (obra_id, autor_email, criado_em);

-- RLS ligado, sem políticas: bloqueia acesso direto via anon key --------
alter table usuarios_permitidos enable row level security;
alter table obras               enable row level security;
alter table registros           enable row level security;

-- Admin inicial ---------------------------------------------------------
insert into usuarios_permitidos (email, nome, is_admin)
values ('conrado.machado@tce.pi.gov.br', 'Conrado Machado', true)
on conflict (email) do update set is_admin = true;
