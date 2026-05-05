'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../../lib/auth-guards'
import { createClient } from '../../../lib/supabase-server'

export async function eliminarProyectoCartera(proyectoId: string) {
  const supabase = await createClient()
  const access = await requireAdmin(supabase)

  if (!access.success) {
    return access
  }

  if (!proyectoId) {
    return { success: false, error: 'No se recibió el proyecto a eliminar.' }
  }

  const { data: proyecto, error: proyectoError } = await supabase
    .from('proyectos')
    .select('id, nombre, codigo_interno')
    .eq('id', proyectoId)
    .maybeSingle()

  if (proyectoError) {
    return { success: false, error: proyectoError.message }
  }

  if (!proyecto) {
    return { success: false, error: 'El proyecto ya no existe o no está disponible.' }
  }

  const { error: updateError } = await supabase
    .from('proyectos')
    .update({
      activo: false,
      archivado: true,
    })
    .eq('id', proyectoId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'archivar_proyecto',
    descripcion: `Proyecto archivado desde cartera: ${proyecto.nombre}.`,
    usuario_id: access.userId,
    metadata: {
      codigo_interno: proyecto.codigo_interno,
      origen: 'cartera-proyectos',
    },
  })

  revalidatePath('/cartera-proyectos')
  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}
