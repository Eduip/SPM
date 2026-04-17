'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearBitacora } from '../../../app/cartera-proyectos/actions/bitacora'
import type { BitacoraProyecto, ProyectoFicha } from '../../../lib/project-types'

export default function BitacoraTab({
  proyecto,
  bitacora,
}: {
  proyecto: ProyectoFicha
  bitacora: BitacoraProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setShowForm(true)} style={primaryButton}>
          + Nueva entrada
        </button>
      </div>

      {showForm && (
        <form
          action={async (formData) => {
            formData.append('proyecto_id', proyecto.id)

            const res = await crearBitacora(formData)
            if (!res.success) return alert(res.error)

            setShowForm(false)
            router.refresh()
          }}
          style={formStyle}
        >
          <select name="tipo" required style={input}>
            <option value="">Tipo</option>
            <option value="observacion">Observación</option>
            <option value="incidencia">Incidencia</option>
            <option value="acuerdo">Acuerdo</option>
            <option value="visita">Visita</option>
          </select>

          <input
            name="descripcion"
            placeholder="Descripción"
            required
            style={input}
          />

          <button type="submit" style={submit}>
            Guardar
          </button>
        </form>
      )}

      <div style={card}>
        <h3 style={title}>Bitácora Reciente</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bitacora.map((item) => (
            <BitacoraItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BitacoraItem({ item }: { item: BitacoraProyecto }) {
  return (
    <div style={row}>
      <div style={avatar}>
        {getInitials(item.usuario_id)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>
          {humanize(item.tipo)}
        </div>

        <div style={sub}>{item.descripcion}</div>

        <div style={date}>
          {new Date(item.created_at).toLocaleString('es-CL')}
        </div>
      </div>
    </div>
  )
}

function getInitials(name?: string | null) {
  if (!name) return 'S'
  return name.slice(0, 2).toUpperCase()
}

function humanize(text?: string | null) {
  if (!text) return 'Registro'
  return text.replace('_', ' ')
}

const card = {
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  border: '1px solid #e5e7eb',
}

const title = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 12,
}

const row = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
}

const avatar = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: '#2563eb',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
}

const sub = {
  fontSize: 14,
  color: '#4b5563',
  marginTop: 4,
}

const date = {
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 6,
}

const primaryButton = {
  height: 40,
  padding: '0 14px',
  borderRadius: 10,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontWeight: 700,
}

const formStyle = {
  display: 'flex',
  gap: 10,
}

const input = {
  height: 40,
  padding: '0 10px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
}

const submit = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0 12px',
}
