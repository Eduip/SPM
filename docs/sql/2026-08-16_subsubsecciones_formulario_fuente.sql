alter table public.campos_formulario_fuente
  add column if not exists subsubgrupo text;

create table if not exists public.subsubsecciones_formulario_fuente (
  id uuid primary key default gen_random_uuid(),
  fuente_id uuid not null references public.fuentes_financiamiento(id) on delete cascade,
  seccion_id uuid not null references public.secciones_formulario_fuente(id) on delete cascade,
  subseccion_id uuid not null references public.subsecciones_formulario_fuente(id) on delete cascade,
  nombre text not null,
  orden integer not null default 1,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_subsubsecciones_formulario_fuente_fuente
  on public.subsubsecciones_formulario_fuente(fuente_id);

create index if not exists idx_subsubsecciones_formulario_fuente_seccion
  on public.subsubsecciones_formulario_fuente(seccion_id);

create index if not exists idx_subsubsecciones_formulario_fuente_subseccion
  on public.subsubsecciones_formulario_fuente(subseccion_id);

create unique index if not exists uq_subsubsecciones_formulario_fuente_nombre
  on public.subsubsecciones_formulario_fuente(subseccion_id, lower(nombre));
