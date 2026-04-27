'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarProveedorProyecto,
  crearProveedorProyecto,
  eliminarProveedorProyecto,
} from '../../../app/cartera-proyectos/actions/proveedores'
import type { BitacoraProyecto, ProyectoFicha } from '../../../lib/project-types'

type ProveedorMetadata = {
  modulo?: string
  tipo_proveedor?: string
  datos_empresa?: {
    razon_social?: string
    rut?: string
    rubro?: string
    nombre_contacto?: string
    correo?: string
    telefono?: string
  }
  contratacion?: {
    tipo_contratacion?: string
    documento_contratacion?: DocumentoMetadata | null
    decreto_administrativo?: DocumentoMetadata | null
  }
  servicio?: {
    tipo_servicio?: string
    descripcion_servicio?: string
    plazo_desde?: string
    plazo_hasta?: string
  }
}

type DocumentoMetadata = {
  nombre_archivo?: string
  ruta_storage?: string
  bucket?: string
  mime_type?: string | null
  tamano_bytes?: number
}

export default function ProveedoresTab({
  proyecto,
  bitacora,
}: {
  proyecto: ProyectoFicha | null
  bitacora: BitacoraProyecto[]
}) {
  const router = useRouter()
  const [tipoProveedor, setTipoProveedor] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [viewingId, setViewingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')

  const proveedores = useMemo(
    () =>
      bitacora.filter(
        (item) =>
          item.tipo === 'proveedor' &&
          (item.metadata as ProveedorMetadata | null)?.modulo === 'proveedores'
      ),
    [bitacora]
  )

  if (!proyecto) {
    return <div style={errorCard}>No se pudo cargar la información del proyecto.</div>
  }

  const handleDelete = async (proveedor: BitacoraProyecto) => {
    const metadata = proveedor.metadata as ProveedorMetadata | null
    const nombre =
      metadata?.datos_empresa?.razon_social || proveedor.titulo || 'este proveedor'

    if (!window.confirm(`¿Eliminar ${nombre}?`)) return

    setDeletingId(proveedor.id)
    setMessage('')

    const result = await eliminarProveedorProyecto({
      proveedorId: proveedor.id,
      proyectoId: proyecto.id,
    })

    setDeletingId('')

    if (!result.success) {
      setMessage(result.error || 'No se pudo eliminar el proveedor.')
      return
    }

    setMessage('Proveedor eliminado correctamente.')
    setViewingId('')
    setEditingId('')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          style={{
            ...messageBox,
            background: message.includes('correctamente') ? '#ecfdf5' : '#fef2f2',
            borderColor: message.includes('correctamente') ? '#bbf7d0' : '#fecaca',
            color: message.includes('correctamente') ? '#166534' : '#b91c1c',
          }}
        >
          {message}
        </div>
      )}

      <div style={card}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={title}>Proveedores</h2>
          <p style={subtitle}>
            Registre proveedores asociados al proyecto y sus antecedentes de contratación.
          </p>
        </div>

        <form
          action={async (formData) => {
            setSaving(true)
            setMessage('')
            formData.append('proyecto_id', proyecto.id)

            const result = await crearProveedorProyecto(formData)

            setSaving(false)

            if (!result.success) {
              setMessage(result.error || 'No se pudo agregar el proveedor.')
              return
            }

            setMessage('Proveedor agregado correctamente.')
            setTipoProveedor('')
            router.refresh()
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
        >
          <Field label="Tipo de proveedor *">
            <select
              name="tipo_proveedor"
              required
              value={tipoProveedor}
              onChange={(event) => setTipoProveedor(event.target.value)}
              style={input}
            >
              <option value="">Seleccione tipo de proveedor</option>
              <option value="persona_natural">Persona natural</option>
              <option value="persona_juridica">Persona jurídica</option>
            </select>
          </Field>

          {tipoProveedor === 'persona_natural' && (
            <ProveedorNaturalFields />
          )}

          {tipoProveedor === 'persona_juridica' && <ProveedorJuridicoFields />}

          <button
            type="submit"
            disabled={saving || !tipoProveedor}
            style={{
              ...submitButton,
              background: saving || !tipoProveedor ? '#93c5fd' : '#2563eb',
              cursor: saving || !tipoProveedor ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Agregar proveedor'}
          </button>
        </form>
      </div>

      <div style={card}>
        <h3 style={{ ...title, fontSize: 22 }}>Proveedores registrados</h3>
        {proveedores.length === 0 ? (
          <div style={emptyState}>Aún no hay proveedores registrados para este proyecto.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proveedores.map((proveedor) => {
              const viewing = viewingId === proveedor.id
              const editing = editingId === proveedor.id

              return (
                <div key={proveedor.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ProveedorItem
                    proveedor={proveedor}
                    deleting={deletingId === proveedor.id}
                    viewing={viewing}
                    editing={editing}
                    onView={() => {
                      setViewingId(viewing ? '' : proveedor.id)
                      setEditingId('')
                    }}
                    onEdit={() => {
                      setEditingId(editing ? '' : proveedor.id)
                      setViewingId('')
                    }}
                    onDelete={() => handleDelete(proveedor)}
                  />

                  {viewing && <ProveedorDetalle proveedor={proveedor} />}

                  {editing && (
                    <ProveedorEditForm
                      proyectoId={proyecto.id}
                      proveedor={proveedor}
                      onCancel={() => setEditingId('')}
                      onSaved={() => {
                        setEditingId('')
                        setMessage('Proveedor actualizado correctamente.')
                        router.refresh()
                      }}
                      onError={(error) => setMessage(error)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProveedorNaturalFields({
  metadata,
  editing = false,
}: {
  metadata?: ProveedorMetadata | null
  editing?: boolean
}) {
  const datos = metadata?.datos_empresa
  const contratacion = metadata?.contratacion
  const servicio = metadata?.servicio

  return (
    <>
      <Section title="Datos del proveedor">
        <div style={twoCols}>
          <Field label="Nombre *">
            <input
              name="razon_social"
              required
              defaultValue={datos?.razon_social ?? ''}
              style={input}
            />
          </Field>
          <Field label="RUT *">
            <input name="rut" required defaultValue={datos?.rut ?? ''} style={input} />
          </Field>
          <Field label="Rubro / categoría *">
            <select name="rubro" required defaultValue={datos?.rubro ?? ''} style={input}>
              <option value="">Seleccione rubro</option>
              <option value="Construcción">Construcción</option>
              <option value="Servicios">Servicios</option>
              <option value="Suministros">Suministros</option>
              <option value="Consultoría">Consultoría</option>
              <option value="Transporte">Transporte</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Correo *">
            <input
              name="correo"
              type="email"
              required
              defaultValue={datos?.correo ?? ''}
              style={input}
            />
          </Field>
          <Field label="Teléfono *">
            <input
              name="telefono"
              required
              defaultValue={datos?.telefono ?? ''}
              style={input}
            />
          </Field>
        </div>
      </Section>

      <Section title="Contratación y servicio">
        <div style={twoCols}>
          <Field label="Tipo de contratación *">
            <select
              name="tipo_contratacion"
              required
              defaultValue={contratacion?.tipo_contratacion ?? ''}
              style={input}
            >
              <option value="">Seleccione tipo</option>
              <option value="Licitación">Licitación</option>
              <option value="Trato directo">Trato directo</option>
              <option value="Contrato de suministro">Contrato de suministro</option>
              <option value="Compra Ágil">Compra Ágil</option>
            </select>
          </Field>
          <Field label="Tipo de servicio *">
            <select
              name="tipo_servicio"
              required
              defaultValue={servicio?.tipo_servicio ?? ''}
              style={input}
            >
              <option value="">Seleccione servicio</option>
              <option value="Consultoría">Consultoría</option>
              <option value="Contratista">Contratista</option>
              <option value="Inspección técnica">Inspección técnica</option>
              <option value="Suministro de materiales">Suministro de materiales</option>
              <option value="Mantención">Mantención</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Desde *">
            <input
              name="plazo_desde"
              type="date"
              required
              defaultValue={servicio?.plazo_desde ?? ''}
              style={input}
            />
          </Field>
          <Field label="Hasta *">
            <input
              name="plazo_hasta"
              type="date"
              required
              defaultValue={servicio?.plazo_hasta ?? ''}
              style={input}
            />
          </Field>
        </div>
        <Field label="Descripción *">
          <textarea
            name="descripcion_servicio"
            required
            defaultValue={servicio?.descripcion_servicio ?? ''}
            style={{ ...input, minHeight: 110, padding: 14, resize: 'vertical' }}
          />
        </Field>
      </Section>

      <Section title="Documentos">
        <div style={twoCols}>
          <Field label={`Documento contratación${editing ? '' : ' *'}`}>
            <input
              name="documento_contratacion"
              type="file"
              required={!editing}
              style={fileInput}
            />
          </Field>
          <Field label={`Decreto administrativo${editing ? '' : ' *'}`}>
            <input
              name="decreto_administrativo"
              type="file"
              required={!editing}
              style={fileInput}
            />
          </Field>
        </div>
        {editing && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
            Si no adjuntas nuevos archivos, se conservarán los documentos existentes.
          </div>
        )}
      </Section>
    </>
  )
}

function ProveedorJuridicoFields({
  metadata,
  editing = false,
}: {
  metadata?: ProveedorMetadata | null
  editing?: boolean
}) {
  const datos = metadata?.datos_empresa
  const contratacion = metadata?.contratacion
  const servicio = metadata?.servicio

  return (
    <>
      <Section title="Datos de la empresa">
        <div style={twoCols}>
          <Field label="Razón social *">
            <input
              name="razon_social"
              required
              defaultValue={datos?.razon_social ?? ''}
              style={input}
            />
          </Field>
          <Field label="RUT *">
            <input name="rut" required defaultValue={datos?.rut ?? ''} style={input} />
          </Field>
          <Field label="Rubro / categoría *">
            <select name="rubro" required defaultValue={datos?.rubro ?? ''} style={input}>
              <option value="">Seleccione rubro</option>
              <option value="Construcción">Construcción</option>
              <option value="Servicios">Servicios</option>
              <option value="Suministros">Suministros</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Transporte">Transporte</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Nombre contacto *">
            <input
              name="nombre_contacto"
              required
              defaultValue={datos?.nombre_contacto ?? ''}
              style={input}
            />
          </Field>
          <Field label="Correo *">
            <input
              name="correo"
              type="email"
              required
              defaultValue={datos?.correo ?? ''}
              style={input}
            />
          </Field>
          <Field label="Teléfono *">
            <input
              name="telefono"
              required
              defaultValue={datos?.telefono ?? ''}
              style={input}
            />
          </Field>
        </div>
      </Section>

      <Section title="Contratación">
        <div style={twoCols}>
          <Field label="Tipo de contratación *">
            <select
              name="tipo_contratacion"
              required
              defaultValue={contratacion?.tipo_contratacion ?? ''}
              style={input}
            >
              <option value="">Seleccione tipo</option>
              <option value="Licitación">Licitación</option>
              <option value="Trato directo">Trato directo</option>
              <option value="Contrato de suministro">Contrato de suministro</option>
              <option value="Compra Ágil">Compra Ágil</option>
            </select>
          </Field>
          <Field label={`Documento de contratación${editing ? '' : ' *'}`}>
            <input
              name="documento_contratacion"
              type="file"
              required={!editing}
              style={fileInput}
            />
          </Field>
          <Field label={`Decreto administrativo${editing ? '' : ' *'}`}>
            <input
              name="decreto_administrativo"
              type="file"
              required={!editing}
              style={fileInput}
            />
          </Field>
        </div>
        {editing && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
            Si no adjuntas nuevos archivos, se conservarán los documentos existentes.
          </div>
        )}
      </Section>

      <Section title="Servicio">
        <div style={threeCols}>
          <Field label="Tipo de servicio *">
            <select
              name="tipo_servicio"
              required
              defaultValue={servicio?.tipo_servicio ?? ''}
              style={input}
            >
              <option value="">Seleccione servicio</option>
              <option value="Consultoría">Consultoría</option>
              <option value="Contratista">Contratista</option>
              <option value="Inspección técnica">Inspección técnica</option>
              <option value="Suministro de materiales">Suministro de materiales</option>
              <option value="Mantención">Mantención</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Desde *">
            <input
              name="plazo_desde"
              type="date"
              required
              defaultValue={servicio?.plazo_desde ?? ''}
              style={input}
            />
          </Field>
          <Field label="Hasta *">
            <input
              name="plazo_hasta"
              type="date"
              required
              defaultValue={servicio?.plazo_hasta ?? ''}
              style={input}
            />
          </Field>
        </div>
        <Field label="Descripción del servicio *">
          <textarea
            name="descripcion_servicio"
            required
            defaultValue={servicio?.descripcion_servicio ?? ''}
            style={{ ...input, minHeight: 110, padding: 14, resize: 'vertical' }}
          />
        </Field>
      </Section>
    </>
  )
}

function ProveedorItem({
  proveedor,
  deleting,
  viewing,
  editing,
  onView,
  onEdit,
  onDelete,
}: {
  proveedor: BitacoraProyecto
  deleting: boolean
  viewing: boolean
  editing: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const metadata = proveedor.metadata as ProveedorMetadata | null
  const datosEmpresa = metadata?.datos_empresa
  const servicio = metadata?.servicio
  const contratacion = metadata?.contratacion
  const esNatural = metadata?.tipo_proveedor === 'persona_natural'

  return (
    <div style={providerRow}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
          {datosEmpresa?.razon_social || proveedor.titulo || 'Proveedor sin nombre'}
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
          {esNatural ? 'Persona natural' : 'Persona jurídica'} ·{' '}
          {datosEmpresa?.rut || 'Sin RUT'} · {datosEmpresa?.rubro || 'Sin rubro'}
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>
          {servicio?.tipo_servicio || 'Servicio'} ·{' '}
          {contratacion?.tipo_contratacion || 'Contratación no informada'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'right' }}>
          {servicio?.plazo_desde && servicio?.plazo_hasta
            ? `${formatDate(servicio.plazo_desde)} - ${formatDate(servicio.plazo_hasta)}`
            : 'Sin plazo'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onView} style={secondaryButton}>
            {viewing ? 'Ocultar' : 'Ver'}
          </button>
          <button type="button" onClick={onEdit} style={secondaryButton}>
            {editing ? 'Cancelar edición' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            style={{
              ...dangerButton,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProveedorDetalle({ proveedor }: { proveedor: BitacoraProyecto }) {
  const metadata = proveedor.metadata as ProveedorMetadata | null
  const datos = metadata?.datos_empresa
  const contratacion = metadata?.contratacion
  const servicio = metadata?.servicio
  const esNatural = metadata?.tipo_proveedor === 'persona_natural'

  return (
    <div style={detailBox}>
      <Info label={esNatural ? 'Nombre' : 'Razón social'} value={datos?.razon_social} />
      <Info label="RUT" value={datos?.rut} />
      <Info label="Rubro / categoría" value={datos?.rubro} />
      {!esNatural && <Info label="Nombre contacto" value={datos?.nombre_contacto} />}
      <Info label="Correo" value={datos?.correo} />
      <Info label="Teléfono" value={datos?.telefono} />
      <Info label="Tipo de contratación" value={contratacion?.tipo_contratacion} />
      <Info label="Tipo de servicio" value={servicio?.tipo_servicio} />
      <Info
        label="Plazo"
        value={
          servicio?.plazo_desde && servicio?.plazo_hasta
            ? `${formatDate(servicio.plazo_desde)} - ${formatDate(servicio.plazo_hasta)}`
            : '-'
        }
      />
      <Info label="Descripción" value={servicio?.descripcion_servicio} wide />
      <Info
        label="Documento contratación"
        value={contratacion?.documento_contratacion?.nombre_archivo}
      />
      <Info
        label="Decreto administrativo"
        value={contratacion?.decreto_administrativo?.nombre_archivo}
      />
    </div>
  )
}

function ProveedorEditForm({
  proyectoId,
  proveedor,
  onCancel,
  onSaved,
  onError,
}: {
  proyectoId: string
  proveedor: BitacoraProyecto
  onCancel: () => void
  onSaved: () => void
  onError: (error: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const metadata = proveedor.metadata as ProveedorMetadata | null
  const tipoProveedor =
    metadata?.tipo_proveedor === 'persona_natural'
      ? 'persona_natural'
      : 'persona_juridica'

  return (
    <form
      action={async (formData) => {
        setSaving(true)
        formData.append('proveedor_id', proveedor.id)
        formData.append('proyecto_id', proyectoId)
        formData.append('tipo_proveedor', tipoProveedor)

        const result = await actualizarProveedorProyecto(formData)

        setSaving(false)

        if (!result.success) {
          onError(result.error || 'No se pudo actualizar el proveedor.')
          return
        }

        onSaved()
      }}
      style={{
        ...card,
        borderColor: '#bfdbfe',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Editar proveedor</h3>
      {tipoProveedor === 'persona_natural' ? (
        <ProveedorNaturalFields metadata={metadata} editing />
      ) : (
        <ProveedorJuridicoFields metadata={metadata} editing />
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} style={submitButton}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancel} style={secondaryButton}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string
  value?: string | null
  wide?: boolean
}) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 600 }}>
        {value || '-'}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function Section({
  title: sectionTitle,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={section}>
      <h3 style={sectionTitleStyle}>{sectionTitle}</h3>
      {children}
    </section>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-CL')
}

const card: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 20,
  padding: 28,
  border: '1px solid #e5e7eb',
}

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const subtitle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 15,
  color: '#6b7280',
  lineHeight: 1.6,
}

const section: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 18,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const twoCols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
}

const threeCols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr',
  gap: 16,
}

const input: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  padding: '0 12px',
  fontSize: 14,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const fileInput: React.CSSProperties = {
  ...input,
  padding: '10px 12px',
}

const submitButton: React.CSSProperties = {
  alignSelf: 'flex-start',
  minWidth: 180,
  height: 46,
  borderRadius: 12,
  border: 'none',
  background: 'var(--primary)',
  color: '#ffffff',
  fontWeight: 800,
}

const secondaryButton: React.CSSProperties = {
  height: 34,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButton: React.CSSProperties = {
  height: 34,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff7f7',
  color: '#b91c1c',
  fontWeight: 800,
}

const messageBox: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
}

const emptyState: React.CSSProperties = {
  borderRadius: 14,
  border: '1px dashed #cbd5e1',
  background: '#f9fafb',
  padding: 16,
  color: '#6b7280',
  fontSize: 14,
  fontWeight: 600,
}

const providerRow: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 16,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 16,
  alignItems: 'start',
}

const detailBox: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16,
}

const errorCard: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 20,
  border: '1px solid #fecaca',
  color: '#b91c1c',
}
