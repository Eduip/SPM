'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearProveedorProyecto } from '../../../app/cartera-proyectos/actions/proveedores'
import type { BitacoraProyecto, ProyectoFicha } from '../../../lib/project-types'

type ProveedorMetadata = {
  modulo?: string
  tipo_proveedor?: string
  datos_empresa?: {
    razon_social?: string
    rut?: string
    rubro?: string
    correo?: string
    telefono?: string
  }
  contratacion?: {
    tipo_contratacion?: string
  }
  servicio?: {
    tipo_servicio?: string
    descripcion_servicio?: string
    plazo_desde?: string
    plazo_hasta?: string
  }
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
    return (
      <div style={errorCard}>
        No se pudo cargar la información del proyecto.
      </div>
    )
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
            <div style={notice}>
              El formulario para Persona natural lo configuraremos en el siguiente paso.
            </div>
          )}

          {tipoProveedor === 'persona_juridica' && (
            <>
              <Section title="Datos de la empresa">
                <div style={twoCols}>
                  <Field label="Nombre o razón social *">
                    <input name="razon_social" required style={input} />
                  </Field>
                  <Field label="RUT *">
                    <input name="rut" required style={input} />
                  </Field>
                  <Field label="Rubro / categoría *">
                    <select name="rubro" required style={input}>
                      <option value="">Seleccione rubro</option>
                      <option value="Construcción">Construcción</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Suministros">Suministros</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </Field>
                  <Field label="Correo *">
                    <input name="correo" type="email" required style={input} />
                  </Field>
                  <Field label="Teléfono *">
                    <input name="telefono" required style={input} />
                  </Field>
                </div>
              </Section>

              <Section title="Contratación">
                <div style={twoCols}>
                  <Field label="Tipo de contratación *">
                    <select name="tipo_contratacion" required style={input}>
                      <option value="">Seleccione tipo</option>
                      <option value="Licitación">Licitación</option>
                      <option value="Trato directo">Trato directo</option>
                      <option value="Contrato de suministro">Contrato de suministro</option>
                      <option value="Compra Ágil">Compra Ágil</option>
                    </select>
                  </Field>
                  <Field label="Documento de contratación *">
                    <input
                      name="documento_contratacion"
                      type="file"
                      required
                      style={fileInput}
                    />
                  </Field>
                  <Field label="Decreto administrativo *">
                    <input
                      name="decreto_administrativo"
                      type="file"
                      required
                      style={fileInput}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Servicio">
                <div style={twoCols}>
                  <Field label="Tipo de servicio *">
                    <select name="tipo_servicio" required style={input}>
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
                    <input name="plazo_desde" type="date" required style={input} />
                  </Field>
                  <Field label="Hasta *">
                    <input name="plazo_hasta" type="date" required style={input} />
                  </Field>
                </div>
                <Field label="Descripción del servicio *">
                  <textarea
                    name="descripcion_servicio"
                    required
                    style={{ ...input, minHeight: 110, padding: 14, resize: 'vertical' }}
                  />
                </Field>
              </Section>
            </>
          )}

          <button
            type="submit"
            disabled={saving || tipoProveedor !== 'persona_juridica'}
            style={{
              ...submitButton,
              background:
                saving || tipoProveedor !== 'persona_juridica' ? '#93c5fd' : '#2563eb',
              cursor:
                saving || tipoProveedor !== 'persona_juridica'
                  ? 'not-allowed'
                  : 'pointer',
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
            {proveedores.map((proveedor) => (
              <ProveedorItem key={proveedor.id} proveedor={proveedor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProveedorItem({ proveedor }: { proveedor: BitacoraProyecto }) {
  const metadata = proveedor.metadata as ProveedorMetadata | null
  const datosEmpresa = metadata?.datos_empresa
  const servicio = metadata?.servicio
  const contratacion = metadata?.contratacion

  return (
    <div style={providerRow}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
          {datosEmpresa?.razon_social || proveedor.titulo || 'Proveedor sin nombre'}
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
          {datosEmpresa?.rut || 'Sin RUT'} · {datosEmpresa?.rubro || 'Sin rubro'}
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>
          {servicio?.tipo_servicio || 'Servicio'} ·{' '}
          {contratacion?.tipo_contratacion || 'Contratación no informada'}
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'right' }}>
        {servicio?.plazo_desde && servicio?.plazo_hasta
          ? `${formatDate(servicio.plazo_desde)} - ${formatDate(servicio.plazo_hasta)}`
          : 'Sin plazo'}
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
  color: '#111827',
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
  color: '#111827',
}

const twoCols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
  color: '#111827',
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
  color: '#ffffff',
  fontWeight: 800,
}

const messageBox: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
}

const notice: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
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

const errorCard: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 20,
  border: '1px solid #fecaca',
  color: '#b91c1c',
}
