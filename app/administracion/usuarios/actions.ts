'use server'

import { createClient } from '../../../lib/supabase-server'
import { createAdminClient } from '../../../lib/supabase-admin'

export async function crearUsuarioPerfil(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const nombre_completo = String(formData.get('nombre_completo') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const rol_id = String(formData.get('rol_id') || '').trim()
  const unidad_id = String(formData.get('unidad_id') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre_completo || !email) {
    return { success: false, error: 'Nombre completo y email son obligatorios.' }
  }

  const tempPassword = generateTempPassword()

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
      },
    })

  if (authError) {
    return { success: false, error: authError.message }
  }

  const userId = authData.user?.id

  if (!userId) {
    return { success: false, error: 'No se pudo obtener el ID del usuario creado.' }
  }

  // 2. Crear o actualizar profile con el mismo id
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nombre_completo,
      email,
      rol_id: rol_id || null,
      unidad_id: unidad_id || null,
      activo,
    })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  return {
    success: true,
    tempPassword,
  }
}

export async function actualizarUsuarioPerfil({
  id,
  nombre_completo,
  email,
  rol_id,
  unidad_id,
  activo,
}: {
  id: string
  nombre_completo: string
  email: string
  rol_id: string
  unidad_id: string
  activo: boolean
}) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const normalizedName = nombre_completo.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (!id || !normalizedName || !normalizedEmail) {
    return { success: false, error: 'Faltan datos para actualizar el usuario.' }
  }

  const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, {
    email: normalizedEmail,
    user_metadata: {
      nombre_completo: normalizedName,
    },
  })

  if (authError) {
    return {
      success: false,
      error: authError.message || 'No se pudo sincronizar el usuario en Supabase Auth.',
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nombre_completo: normalizedName,
      email: normalizedEmail,
      rol_id: rol_id || null,
      unidad_id: unidad_id || null,
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function eliminarUsuarioPerfil(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  if (!id) {
    return { success: false, error: 'No se recibió el usuario a eliminar.' }
  }

  if (id === user.id) {
    return { success: false, error: 'No puedes eliminar tu propio usuario mientras estás conectado.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

function generateTempPassword() {
  const random = Math.random().toString(36).slice(-8)
  return `Tmp#${random}A1`
}
