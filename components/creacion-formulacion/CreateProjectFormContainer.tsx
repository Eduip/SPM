'use client'

import { useMemo, useState } from 'react'
import ProjectDataForm from './ProjectDataForm'
import RecentProjectsPanel from './RecentProjectsPanel'
import RecentActivityPanel from './RecentActivityPanel'
import { useRouter } from 'next/navigation'
import { saveProjectData } from '../../app/creacion-formulacion/actions'

export type CatalogOption = {
  id: string
  nombre: string
}

export type ResponsibleOption = {
  id: string
  nombre_completo: string
  email: string
}

export type BeneficiaryGroup = {
  id: string
  group: string
  quantity: string
}

export type ProjectFormData = {
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

type ProyectoInicial = {
  nombre?: string | null
  codigo_adicional?: string | null
  tipo_proyecto_id?: string | null
  categoria_id?: string | null
  anio_inicio?: number | string | null
  unidad_id?: string | null
  monto_estimado?: number | string | null
  localizacion?: string | null
  fuente_financiamiento_id?: string | null
  responsable_id?: string | null
}

type DatosGeneralesIniciales = {
  descripcion?: string | null
  poblacion_beneficiaria?: unknown
} | null

type CreateProjectFormContainerProps = {
    proyectoId?: string
    tiposProyecto: CatalogOption[]
    categorias: CatalogOption[]
    unidades: CatalogOption[]
    responsables: ResponsibleOption[]
    proyectoInicial?: ProyectoInicial | null
    datosGeneralesIniciales?: DatosGeneralesIniciales
}

export default function CreateProjectFormContainer({
    proyectoId = '',
    tiposProyecto,
    categorias,
    unidades,
    responsables,
    proyectoInicial = null,
    datosGeneralesIniciales = null,
}: CreateProjectFormContainerProps) {
  const initialResponsibleId = responsables[0]?.id ?? ''
  const initialTipoProyectoId = tiposProyecto[0]?.id ?? ''

  const [formData, setFormData] = useState<ProjectFormData>(() => ({
    nombre: proyectoInicial?.nombre ?? '',
    codigo_adicional: proyectoInicial?.codigo_adicional ?? '',
    tipo_proyecto_id: proyectoInicial?.tipo_proyecto_id ?? initialTipoProyectoId,
    categoria_id: proyectoInicial?.categoria_id ?? '',
    anio_inicio: stringifyInitialValue(proyectoInicial?.anio_inicio),
    unidad_id: proyectoInicial?.unidad_id ?? '',
    monto_estimado: stringifyInitialValue(proyectoInicial?.monto_estimado),
    localizacion: proyectoInicial?.localizacion ?? 'Curacautín, Chile',
    fuente_financiamiento_id: proyectoInicial?.fuente_financiamiento_id ?? '',
    responsable_id: proyectoInicial?.responsable_id ?? initialResponsibleId,
    descripcion: datosGeneralesIniciales?.descripcion ?? '',
    poblacion_beneficiaria: normalizeInitialBeneficiaries(
      datosGeneralesIniciales?.poblacion_beneficiaria
    ),
  }))

  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [savedProjectId, setSavedProjectId] = useState(proyectoId)

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    const result = await saveProjectData({
      proyectoId: savedProjectId || proyectoId || undefined,
      ...formData,
    })

    if (!result.success) {
      setSaveError(result.error || 'Ocurrió un error al guardar.')
      setSaving(false)
      return
    }

    setSavedProjectId(result.proyectoId || '')
    setSaveSuccess(`Proyecto guardado correctamente con código ${result.codigoInterno}.`)
    setSaving(false)
    router.push(`/creacion-formulacion?proyectoId=${result.proyectoId}`)
    router.refresh()
  }

  const selectedResponsible = useMemo(() => {
    return responsables.find((r) => r.id === formData.responsable_id) ?? null
  }, [responsables, formData.responsable_id])

  const handleFieldChange = (
    field: keyof Omit<ProjectFormData, 'poblacion_beneficiaria'>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'monto_estimado' ? keepOnlyDigits(value) : value,
    }))
  }

  const handleTypeSelect = (tipoId: string) => {
    setFormData((prev) => ({
      ...prev,
      tipo_proyecto_id: tipoId,
    }))
  }

  const handleBeneficiaryChange = (
    rowId: string,
    field: 'group' | 'quantity',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      poblacion_beneficiaria: prev.poblacion_beneficiaria.map((row) =>
        row.id === rowId
          ? { ...row, [field]: field === 'quantity' ? keepOnlyDigits(value) : value }
          : row
      ),
    }))
  }

  const handleAddBeneficiary = () => {
    setFormData((prev) => ({
      ...prev,
      poblacion_beneficiaria: [
        ...prev.poblacion_beneficiaria,
        {
          id: crypto.randomUUID(),
          group: '',
          quantity: '',
        },
      ],
    }))
  }

  const handleRemoveBeneficiary = (rowId: string) => {
    setFormData((prev) => ({
      ...prev,
      poblacion_beneficiaria: prev.poblacion_beneficiaria.filter(
        (row) => row.id !== rowId
      ),
    }))
  }

  return (
    <>
      {(saveError || saveSuccess) && (
        <div
          style={{
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 18,
            background: saveError ? '#fef2f2' : '#ecfdf5',
            border: saveError ? '1px solid #fecaca' : '1px solid #bbf7d0',
            color: saveError ? '#b91c1c' : '#166534',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {saveError || saveSuccess}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.85fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <ProjectDataForm
          tiposProyecto={tiposProyecto}
          categorias={categorias}
          unidades={unidades}
          responsables={responsables}
          formData={formData}
          selectedResponsible={selectedResponsible}
          onFieldChange={handleFieldChange}
          onTypeSelect={handleTypeSelect}
          onBeneficiaryChange={handleBeneficiaryChange}
          onAddBeneficiary={handleAddBeneficiary}
          onRemoveBeneficiary={handleRemoveBeneficiary}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <RecentProjectsPanel />
          <RecentActivityPanel />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 58,
              borderRadius: 18,
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 18,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.75 : 1,
              boxShadow: '0 14px 30px rgba(37,99,235,0.25)',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar proyecto'}
          </button>

          <button
  onClick={() => {
    if (!savedProjectId) return
    router.push(`/creacion-formulacion/diagnostico?proyectoId=${savedProjectId}`)
  }}
  disabled={!savedProjectId}
  style={{
    height: 58,
    borderRadius: 18,
    border: 'none',
    background: savedProjectId ? '#2563eb' : '#93c5fd',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 18,
    cursor: savedProjectId ? 'pointer' : 'not-allowed',
    boxShadow: savedProjectId
      ? '0 14px 30px rgba(37,99,235,0.25)'
      : 'none',
    opacity: savedProjectId ? 1 : 0.9,
  }}
>
  Continuar al Diagnóstico&nbsp;&nbsp;→
</button>
        </div>
      </div>
    </>
  )
}

function keepOnlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function stringifyInitialValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeInitialBeneficiaries(value: unknown): BeneficiaryGroup[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      { id: crypto.randomUUID(), group: 'Adultos mayores', quantity: '' },
      { id: crypto.randomUUID(), group: 'Niños', quantity: '' },
      { id: crypto.randomUUID(), group: 'Jóvenes', quantity: '' },
    ]
  }

  return value.map((item) => {
    const row = isRecord(item) ? item : {}

    return {
      id: crypto.randomUUID(),
      group: stringifyInitialValue(row.group),
      quantity: stringifyInitialValue(row.quantity),
    }
  })
}

function isRecord(value: unknown): value is Record<string, string | number | null> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
