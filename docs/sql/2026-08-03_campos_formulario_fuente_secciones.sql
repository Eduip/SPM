create table if not exists public.secciones_formulario_fuente (
  id uuid primary key default gen_random_uuid(),
  fuente_id uuid not null references public.fuentes_financiamiento(id) on delete cascade,
  nombre text not null,
  orden integer not null default 1,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.campos_formulario_fuente
  add column if not exists seccion_id uuid references public.secciones_formulario_fuente(id) on delete set null;
