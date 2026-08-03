alter table public.campos_formulario_fuente
  add column if not exists descripcion_campo text,
  add column if not exists grupo text,
  add column if not exists subgrupo text;
