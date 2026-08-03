alter table public.campos_formulario_fuente
  add column if not exists config_json jsonb;
