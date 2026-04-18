'use server'

import { createClient } from '../../../lib/supabase-server'
import type { DynamicFieldValue } from '../../../lib/formulacion-types'

type RespuestaDinamicaPayload = {
  proyecto_id: string
  fuente_id: string
  campo_id: string
  valor_texto: string | null
  valor_numero: number | null
  valor_booleano: boolean | null
  valor_fecha: string | null
  valor_json: DynamicFieldValue
}

export async function guardarRespuestaDinamica({
  proyectoId,
  fuenteId,
  campoId,
  tipo,
  valor,
}: {
  proyectoId: string
  fuenteId: string
  campoId: string
  tipo: string
  valor: DynamicFieldValue
}) {
  const supabase = await createClient()

  const payload: RespuestaDinamicaPayload = {
    proyecto_id: proyectoId,
    fuente_id: fuenteId,
    campo_id: campoId,
    valor_texto: null,
    valor_numero: null,
    valor_booleano: null,
    valor_fecha: null,
    valor_json: null,
  }

  if (tipo === 'texto' || tipo === 'texto_largo' || tipo === 'archivo') {
    payload.valor_texto = valor ? String(valor) : null
  } else if (tipo === 'numero' || tipo === 'plazo' || tipo === 'presupuesto') {
    payload.valor_numero = valor === '' || valueIsNullish(valor) ? null : Number(valor)
  } else if (tipo === 'booleano') {
    payload.valor_booleano = Boolean(valor)
  } else if (tipo === 'fecha') {
    payload.valor_fecha = valueIsNullish(valor) || valor === '' ? null : String(valor)
  } else {
    payload.valor_json = valor ?? null
  }

  const { data: existing } = await supabase
    .from('proyecto_postulacion_respuestas')
    .select('id')
    .eq('proyecto_id', proyectoId)
    .eq('campo_id', campoId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('proyecto_postulacion_respuestas')
      .update(payload)
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const { error } = await supabase
    .from('proyecto_postulacion_respuestas')
    .insert(payload)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

function valueIsNullish(value: unknown) {
  return value === null || value === undefined
}
