import type { ProyectoFicha } from './project-types'

export type DynamicFieldValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[]
  | null

export type CampoPostulacion = {
  id: string
  fuente_id: string
  nombre: string
  descripcion_campo?: string | null
  seccion_id?: string | null
  seccion_nombre?: string | null
  seccion_orden?: number | null
  grupo?: string | null
  subgrupo?: string | null
  orden_codigo?: string | null
  config_json?: TableFieldConfig | null
  tipo: 'texto' | 'texto_largo' | 'numero' | 'fecha' | 'booleano' | 'plazo' | 'presupuesto' | string
  obligatorio: boolean
  visible: boolean
  orden: number
  ai_mode?: 'blocked' | 'suggest' | 'improve_only'
}

export type TableFieldItemKind =
  | 'static_text'
  | 'input_text'
  | 'input_number'
  | 'input_textarea'
  | 'sum_numbers'

export type TableFieldItemConfig = {
  id: string
  kind: TableFieldItemKind
  label?: string | null
  text?: string | null
  placeholder?: string | null
  highlighted?: boolean | null
}

export type TableFieldCellBackground = 'default' | 'header' | 'soft_blue'

export type TableFieldCellAlign = 'left' | 'center' | 'right'

export type TableFieldCellVerticalAlign = 'top' | 'middle' | 'bottom'

export type TableFieldCellConfig = {
  id: string
  colspan?: number | null
  background?: TableFieldCellBackground | null
  align?: TableFieldCellAlign | null
  vertical_align?: TableFieldCellVerticalAlign | null
  items: TableFieldItemConfig[]
}

export type TableFieldColumnConfig = {
  id: string
  header: string
}

export type TableFieldRowConfig = {
  id: string
  variant?: 'body' | 'header' | null
  cells: TableFieldCellConfig[]
}

export type TableFieldConfig = {
  columns: TableFieldColumnConfig[]
  rows: TableFieldRowConfig[]
}

export type RespuestaPostulacion = {
  campo_id: string
  valor_texto: string | null
  valor_numero: number | null
  valor_booleano: boolean | null
  valor_fecha: string | null
  valor_json: DynamicFieldValue
}

export type FuenteCatalogo = {
  id: string
  nombre: string
}

export type DocumentoFuente = {
  id: string
  fuente_id: string
  nombre: string
  obligatorio: boolean
  orden?: number | null
  estado_revision?: string | null
}

export type CatalogoDocumentoFormulacion = {
  id: string
  nombre: string
  obligatorio: boolean
}

export type DocumentoAprobacion = {
  id: string
  catalogo_documento_id?: string | null
  nombre?: string | null
  nombre_archivo?: string | null
  observacion?: string | null
  obligatorio?: boolean | null
  estado_revision?: string | null
}

export type ReglaFuente = {
  id: string
  fuente_id: string
  descripcion: string
}

export type SeccionFormularioFuente = {
  id: string
  fuente_id: string
  nombre: string
  orden: number
  activa?: boolean | null
}

export type SubseccionFormularioFuente = {
  id: string
  fuente_id: string
  seccion_id: string
  nombre: string
  orden: number
  activa?: boolean | null
}

export type DiagnosticoProyecto = {
  problema_central?: string | null
  justificacion?: string | null
}

export type PostulacionProyecto = {
  monto_total?: number | string | null
  periodo?: string | null
  puntaje_total?: number | string | null
  porcentaje_evaluacion?: number | string | null
}

export type ProyectoAprobacion = ProyectoFicha
