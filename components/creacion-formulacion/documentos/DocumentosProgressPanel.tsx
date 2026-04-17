'use client'

import { useRouter } from 'next/navigation'
import { cardStyle } from '../shared'
import { marcarDocumentosCompletados } from '../../../app/creacion-formulacion/documentos/complete-actions'

export default function DocumentosProgressPanel({
  proyectoId,
  total,
  subidos,
  faltantes,
}: {
  proyectoId: string
  total: number
  subidos: number
  faltantes: number
}) {
  const router = useRouter()
  const completo = total === 0 || faltantes === 0
  const completados = total - faltantes
  const progresoDocumental = total > 0 ? Math.round((completados / total) * 100) : 100
  const progresoFormulacion = completo ? 80 : 60

  const handleContinuar = async () => {
    if (!completo) return

    const result = await marcarDocumentosCompletados(proyectoId)

    if (!result.success) {
      alert(result.error || 'No se pudo completar la etapa de documentos.')
      return
    }

    router.push(`/creacion-formulacion/aprobacion?proyectoId=${proyectoId}`)
  }

  return (
    <div style={cardStyle}>
      <div
        style={{
          borderRadius: 18,
          background: '#eff6ff',
          border: '1px solid #dbeafe',
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: 8,
          }}
        >
          ¿Completó la documentación?
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: '#4b5563',
            marginBottom: 18,
          }}
        >
          {completo
            ? 'Continúe a la siguiente etapa para enviar el proyecto a revisión y aprobación final.'
            : `Faltan ${faltantes} documento${faltantes === 1 ? '' : 's'} obligatorio${faltantes === 1 ? '' : 's'} por subir.`}
        </div>

        <button
          onClick={handleContinuar}
          disabled={!completo}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 14,
            border: 'none',
            background: completo ? '#2563eb' : '#93c5fd',
            color: '#ffffff',
            fontWeight: 700,
            cursor: completo ? 'pointer' : 'not-allowed',
            boxShadow: completo ? '0 10px 18px rgba(37,99,235,0.20)' : 'none',
            marginBottom: 12,
          }}
        >
          Continuar a Aprobación →
        </button>

        <button
          onClick={() => router.push('/cartera-proyectos')}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 14,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Guardar y volver al listado
        </button>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            marginBottom: 8,
            fontWeight: 600,
            color: '#4b5563',
          }}
        >
          <span>Progreso de formulación</span>
          <span style={{ color: '#2563eb' }}>{progresoFormulacion}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: `${progresoFormulacion}%`,
              height: '100%',
              background: '#2563eb',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {completo ? '4 de 5 secciones completadas' : '3 de 5 secciones completadas'}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            marginBottom: 8,
            fontWeight: 600,
            color: '#4b5563',
          }}
        >
          <span>Documentos obligatorios</span>
          <span style={{ color: '#16a34a' }}>{progresoDocumental}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: `${progresoDocumental}%`,
              height: '100%',
              background: '#16a34a',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {subidos} subidos, {faltantes} faltantes
        </div>
      </div>
    </div>
  )
}
