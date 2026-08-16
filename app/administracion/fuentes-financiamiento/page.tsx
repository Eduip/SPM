import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import { createAdminClient } from '../../../lib/supabase-admin'
import FuentesFinanciamientoPage from '../../../components/administracion/fuentes/FuentesFinanciamientoPage'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import { listFieldAIConfigs } from '../../../lib/ai/field-ai-config'
import { listEstadoPagoDocumentConfigs } from '../../../lib/estado-pago-document-config'
import type {
  SeccionFormularioFuente,
  SubseccionFormularioFuente,
} from '../../../lib/formulacion-types'

export default async function Page() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

    if (!access.success) {
      return (
        <AppShell title="Fuentes de Financiamiento" currentModule="administracion">
          <AccessDenied message={access.error} />
        </AppShell>
      )
    }

    const { data: fuentes, error } = await supabase
    .from('fuentes_financiamiento')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

    const { data: documentos } = await supabase
    .from('documentos_fuente')
    .select('*')
    .order('orden', { ascending: true })

    const [camposRes, fieldAIConfigs, documentosEstadoPago, seccionesRes, subseccionesRes] = await Promise.all([
      supabase
        .from('campos_formulario_fuente')
        .select('*')
        .eq('visible', true)
        .order('orden', { ascending: true }),
      listFieldAIConfigs(),
      listEstadoPagoDocumentConfigs(),
      supabase
        .from('secciones_formulario_fuente')
        .select('*')
        .eq('activa', true)
        .order('orden', { ascending: true }),
      adminSupabase
        .from('subsecciones_formulario_fuente')
        .select('*')
        .eq('activa', true)
        .order('orden', { ascending: true }),
    ])

    const secciones = (seccionesRes.data ?? []) as SeccionFormularioFuente[]
    const subsecciones = (subseccionesRes.data ?? []) as SubseccionFormularioFuente[]
    const seccionMap = new Map(secciones.map((seccion) => [seccion.id, seccion]))
    const aiModeMap = new Map(fieldAIConfigs.map((item) => [item.fieldId, item.mode]))
    const campos = (camposRes.data ?? []).map((campo) => ({
      ...campo,
      seccion_nombre: campo.seccion_id ? seccionMap.get(campo.seccion_id)?.nombre ?? null : null,
      seccion_orden: campo.seccion_id ? seccionMap.get(campo.seccion_id)?.orden ?? null : null,
      ai_mode: aiModeMap.get(campo.id),
    }))

    const { data: reglas } = await supabase
    .from('reglas_validacion_fuente')
    .select('*')

  return (
    <AppShell title="Fuentes de Financiamiento" currentModule="administracion">
<FuentesFinanciamientoPage
  fuentes={fuentes ?? []}
  documentos={documentos ?? []}
  documentosEstadoPago={documentosEstadoPago}
  secciones={secciones}
  subsecciones={subsecciones}
  campos={campos}
  reglas={reglas ?? []}
  error={error?.message ?? null}
/>
    </AppShell>
  )
}
