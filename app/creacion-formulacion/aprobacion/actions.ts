'use server'

import { createClient } from '../../../lib/supabase-server'

const ESTADOS_DOCUMENTO_VALIDOS = ['subido', 'validado', 'pendiente_revision']

export async function aprobarProyecto(proyectoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'No se pudo identificar al usuario autenticado.',
    }
  }

  if (!proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return {
      success: false,
      error: 'El usuario no tiene perfil asociado.',
    }
  }

  const { data: fuenteProyecto, error: fuenteError } = await supabase
    .from('proyecto_fuentes_financiamiento')
    .select('fuente_id')
    .eq('proyecto_id', proyectoId)
    .limit(1)
    .maybeSingle()

  if (fuenteError) {
    return {
      success: false,
      error: fuenteError.message || 'No se pudo validar la fuente de financiamiento.',
    }
  }

  if (!fuenteProyecto?.fuente_id) {
    return {
      success: false,
      error: 'Debes seleccionar una fuente de financiamiento antes de aprobar.',
    }
  }

  const [documentosFuenteRes, documentosRes] = await Promise.all([
    supabase
      .from('documentos_fuente')
      .select('id, nombre, obligatorio')
      .eq('fuente_id', fuenteProyecto.fuente_id),
    supabase
      .from('documentos_proyecto')
      .select('catalogo_documento_id, observacion, estado_revision')
      .eq('proyecto_id', proyectoId)
      .eq('etapa', 'documentos'),
  ])

  if (documentosFuenteRes.error) {
    return {
      success: false,
      error:
        documentosFuenteRes.error.message ||
        'No se pudo validar el catálogo documental de la fuente.',
    }
  }

  if (documentosRes.error) {
    return {
      success: false,
      error: documentosRes.error.message || 'No se pudieron validar los documentos.',
    }
  }

  const documentosPorRequisito = new Map(
    (documentosRes.data ?? [])
      .map((doc) => [getRequirementId(doc), doc] as const)
      .filter(([requirementId]) => Boolean(requirementId))
  )

  const documentosFaltantes = (documentosFuenteRes.data ?? [])
    .filter((item) => item.obligatorio)
    .filter((item) => {
      const documento = documentosPorRequisito.get(item.id)
      return !ESTADOS_DOCUMENTO_VALIDOS.includes(documento?.estado_revision ?? '')
    })

  if (documentosFaltantes.length > 0) {
    return {
      success: false,
      error: `Faltan documentos obligatorios: ${documentosFaltantes
        .map((doc) => doc.nombre)
        .join(', ')}.`,
    }
  }

  const { error: updateError } = await supabase
    .from('proyectos')
    .update({
      estado: 'aprobado',
      etapa_formulacion_actual: 5,
      porcentaje_formulacion: 100,
      updated_by: profile.id,
    })
    .eq('id', proyectoId)

  if (updateError) {
    return {
      success: false,
      error: updateError.message || 'No se pudo aprobar el proyecto.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: proyectoId,
      p_accion: 'aprobar',
      p_descripcion: 'Proyecto aprobado correctamente.',
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'aprobacion',
        estado: 'aprobado',
        porcentaje_formulacion: 100,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'El proyecto se aprobó, pero falló el registro en historial.',
    }
  }

  return {
    success: true,
  }
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
