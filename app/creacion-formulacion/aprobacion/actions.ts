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

  const [catalogoRes, documentosRes, postulacionRes] = await Promise.all([
    supabase
      .from('catalogo_documentos_formulacion')
      .select('id, nombre, obligatorio')
      .eq('activo', true)
      .eq('etapa', 'documentos'),
    supabase
      .from('documentos_proyecto')
      .select('catalogo_documento_id, estado_revision')
      .eq('proyecto_id', proyectoId),
    supabase
      .from('proyecto_postulacion')
      .select('puntaje_total, monto_total')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),
  ])

  if (catalogoRes.error) {
    return {
      success: false,
      error: catalogoRes.error.message || 'No se pudo validar el catálogo documental.',
    }
  }

  if (documentosRes.error) {
    return {
      success: false,
      error: documentosRes.error.message || 'No se pudieron validar los documentos.',
    }
  }

  if (postulacionRes.error) {
    return {
      success: false,
      error: postulacionRes.error.message || 'No se pudo validar la postulación.',
    }
  }

  const documentosPorCatalogo = new Map(
    (documentosRes.data ?? [])
      .filter((doc) => doc.catalogo_documento_id)
      .map((doc) => [doc.catalogo_documento_id, doc])
  )

  const documentosFaltantes = (catalogoRes.data ?? [])
    .filter((item) => item.obligatorio)
    .filter((item) => {
      const documento = documentosPorCatalogo.get(item.id)
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

  const postulacion = postulacionRes.data
  if (Number(postulacion?.puntaje_total ?? 0) < 21) {
    return {
      success: false,
      error: 'La evaluación técnica no alcanza el puntaje mínimo para aprobar.',
    }
  }

  if (!postulacion?.monto_total) {
    return {
      success: false,
      error: 'El presupuesto de la postulación no está validado.',
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
