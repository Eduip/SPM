'use server'

import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

export async function marcarDocumentosCompletados(proyectoId: string) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!access.success) {
    return access
  }

  if (!proyectoId) {
    return { success: false, error: 'No se recibió el proyecto.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', access.userId)
    .maybeSingle()

  if (!profile) {
    return { success: false }
  }

  const { data: fuenteProyecto, error: fuenteError } = await supabase
    .from('proyecto_fuentes_financiamiento')
    .select('fuente_id')
    .eq('proyecto_id', proyectoId)
    .limit(1)
    .maybeSingle()

  if (fuenteError) {
    return { success: false, error: fuenteError.message }
  }

  if (!fuenteProyecto?.fuente_id) {
    return {
      success: false,
      error: 'Debes seleccionar y guardar una fuente de financiamiento antes de completar documentos.',
    }
  }

  const { data: documentosRequeridos, error: requeridosError } = await supabase
    .from('documentos_fuente')
    .select('id, nombre')
    .eq('fuente_id', fuenteProyecto.fuente_id)
    .eq('obligatorio', true)

  if (requeridosError) {
    return { success: false, error: requeridosError.message }
  }

  const requiredIds = new Set((documentosRequeridos ?? []).map((doc) => doc.id))

  if (requiredIds.size > 0) {
    const { data: documentosSubidos, error: subidosError } = await supabase
      .from('documentos_proyecto')
      .select('catalogo_documento_id, observacion')
      .eq('proyecto_id', proyectoId)
      .eq('etapa', 'documentos')

    if (subidosError) {
      return { success: false, error: subidosError.message }
    }

    const uploadedIds = new Set(
      (documentosSubidos ?? [])
        .map((doc) => getRequirementId(doc))
        .filter(Boolean)
    )
    const faltantes = (documentosRequeridos ?? []).filter(
      (doc) => !uploadedIds.has(doc.id)
    )

    if (faltantes.length > 0) {
      return {
        success: false,
        error: `Faltan ${faltantes.length} documento${faltantes.length === 1 ? '' : 's'} obligatorio${faltantes.length === 1 ? '' : 's'} por subir.`,
      }
    }
  }

  const { error } = await supabase
    .from('proyectos')
    .update({
      etapa_formulacion_actual: 4,
      porcentaje_formulacion: 80,
      updated_by: profile.id,
    })
    .eq('id', proyectoId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.rpc('registrar_evento_historial', {
    p_entidad: 'proyecto',
    p_entidad_id: proyectoId,
    p_accion: 'editar',
    p_descripcion: 'Etapa de documentos completada correctamente.',
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'documentos',
      porcentaje_formulacion: 80,
    },
  })

  return { success: true }
}

function getRequirementId(documento: {
  catalogo_documento_id: string | null
  observacion: string | null
}) {
  if (documento.catalogo_documento_id) return documento.catalogo_documento_id

  const prefix = 'documento_fuente_id:'

  if (documento.observacion?.startsWith(prefix)) {
    return documento.observacion.slice(prefix.length)
  }

  return ''
}
