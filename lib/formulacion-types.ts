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
  tipo: string
  obligatorio: boolean
  visible: boolean
  orden: number
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
  obligatorio?: boolean | null
  estado_revision?: string | null
}

export type ReglaFuente = {
  id: string
  fuente_id: string
  descripcion: string
}

export type DiagnosticoProyecto = {
  problema_central?: string | null
}

export type PostulacionProyecto = {
  monto_total?: number | string | null
  periodo?: string | null
  puntaje_total?: number | string | null
  porcentaje_evaluacion?: number | string | null
}

export type ProyectoAprobacion = ProyectoFicha
