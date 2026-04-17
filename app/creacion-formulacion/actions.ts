'use server'

import { createClient } from '../../lib/supabase-server'

type BeneficiaryGroup = {
  id: string
  group: string
  quantity: string
}

type SaveProjectPayload = {
  nombre: string
  codigo_adicional: string
  tipo_proyecto_id: string
  categoria_id: string
  anio_inicio: string
  unidad_id: string
  monto_estimado: string
  localizacion: string
  fuente_financiamiento_id: string
  responsable_id: string
  descripcion: string
  poblacion_beneficiaria: BeneficiaryGroup[]
}

export async function saveProjectData(payload: SaveProjectPayload) {
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

  const requiredFields = [
    { key: 'nombre', label: 'Nombre del proyecto' },
    { key: 'tipo_proyecto_id', label: 'Tipo de proyecto' },
    { key: 'categoria_id', label: 'Categoría' },
    { key: 'anio_inicio', label: 'Año de inicio' },
    { key: 'unidad_id', label: 'Unidad responsable' },
    { key: 'monto_estimado', label: 'Monto estimado' },
    { key: 'fuente_financiamiento_id', label: 'Fuente del proyecto' },
    { key: 'responsable_id', label: 'Responsable del proyecto' },
    { key: 'descripcion', label: 'Descripción del proyecto' },
  ] as const

  for (const field of requiredFields) {
    const value = payload[field.key]
    if (!value || String(value).trim() === '') {
      return {
        success: false,
        error: `El campo "${field.label}" es obligatorio.`,
      }
    }
  }

  const parsedYear = Number(payload.anio_inicio)
  if (Number.isNaN(parsedYear)) {
    return {
      success: false,
      error: 'El año de inicio no es válido.',
    }
  }

  const normalizedAmount = Number(
    String(payload.monto_estimado).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '')
  )

  if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
    return {
      success: false,
      error: 'El monto estimado no es válido.',
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
      error: 'El usuario no tiene perfil asociado en el sistema.',
    }
  }

  const { data: estadoFormulacion } = await supabase
    .from('estados_proyecto')
    .select('id')
    .eq('codigo', 'EN_FORMULACION')
    .maybeSingle()

  if (!estadoFormulacion) {
    return {
      success: false,
      error: 'No existe el estado EN_FORMULACION en la base de datos.',
    }
  }

  const { data: proyecto, error: proyectoError } = await supabase
    .from('proyectos')
    .insert({
      codigo_adicional: payload.codigo_adicional || null,
      nombre: payload.nombre,
      descripcion: null,
      tipo_proyecto_id: payload.tipo_proyecto_id,
      categoria_id: payload.categoria_id,
      unidad_id: payload.unidad_id,
      fuente_financiamiento_id: payload.fuente_financiamiento_id,
      responsable_id: payload.responsable_id,
      localizacion: payload.localizacion || null,
      anio_inicio: parsedYear,
      monto_estimado: normalizedAmount,
      estado_proyecto_id: estadoFormulacion.id,
      etapa_formulacion_actual: 1,
      porcentaje_formulacion: 20,
      avance_fisico_actual: 0,
      avance_financiero_actual: 0,
      activo: true,
      archivado: false,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id, codigo_interno, nombre')
    .single()

  if (proyectoError || !proyecto) {
    return {
      success: false,
      error: proyectoError?.message || 'No se pudo crear el proyecto.',
    }
  }

  const beneficiariosLimpios = payload.poblacion_beneficiaria
    .filter((item) => item.group.trim() !== '' || item.quantity.trim() !== '')
    .map((item) => ({
      group: item.group.trim(),
      quantity: item.quantity.trim(),
    }))

  const { error: datosGeneralesError } = await supabase
    .from('proyecto_datos_generales')
    .insert({
      proyecto_id: proyecto.id,
      descripcion: payload.descripcion,
      poblacion_beneficiaria: beneficiariosLimpios,
    })

  if (datosGeneralesError) {
    return {
      success: false,
      error:
        datosGeneralesError.message ||
        'Se creó el proyecto, pero falló el guardado de los datos generales.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: proyecto.id,
      p_accion: 'crear',
      p_descripcion: `Proyecto creado en etapa Datos del Proyecto: ${proyecto.nombre}`,
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'datos-proyecto',
        codigo_interno: proyecto.codigo_interno,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'El proyecto fue creado, pero no se pudo registrar el historial.',
    }
  }

  return {
    success: true,
    proyectoId: proyecto.id,
    codigoInterno: proyecto.codigo_interno,
  }
}