export type NamedRef = {
  nombre?: string | null
}

export type ResponsableRef = {
  nombre_completo?: string | null
}

export type ProyectoFicha = {
  id: string
  codigo_interno?: string | null
  nombre?: string | null
  anio_inicio?: number | string | null
  monto_estimado?: number | string | null
  localizacion?: string | null
  avance_fisico_actual?: number | string | null
  avance_financiero_actual?: number | string | null
  porcentaje_formulacion?: number | string | null
  estado?: string | null
  created_at?: string | null
  responsable_id?: string | null
  unidad_id?: string | null
  fuente_financiamiento_id?: string | null
  unidad?: NamedRef | null
  fuente?: NamedRef | null
  responsable?: ResponsableRef | null
}

export type TransferenciaProyecto = {
  id: string
  concepto?: string | null
  fecha?: string | null
  monto?: number | string | null
  estado?: string | null
}

export type GarantiaProyecto = {
  id: string
  tipo?: string | null
  numero_documento?: string | null
  emisor?: string | null
  monto?: number | string | null
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  estado?: string | null
}

export type EstadoPagoProyecto = {
  id: string
  numero?: number | string | null
  fecha?: string | null
  monto?: number | string | null
  avance_fisico?: number | string | null
  estado?: string | null
}

export type RendicionProyecto = {
  id: string
  numero_rendicion?: number | string | null
  estado_pago_id?: string | null
  fecha?: string | null
  monto_rendido?: number | string | null
  observacion?: string | null
  estado?: string | null
}

export type HistorialEvento = {
  id: string
  accion?: string | null
  descripcion?: string | null
  entidad_id?: string | null
  usuario_id?: string | null
  created_at: string
  metadata?: Record<string, unknown> | null
}

export type BitacoraProyecto = {
  id: string
  tipo?: string | null
  descripcion?: string | null
  usuario_id?: string | null
  created_at: string
}
