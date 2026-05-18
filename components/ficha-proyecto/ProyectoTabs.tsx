'use client'

import { useRouter } from 'next/navigation'
import GeneralTab from './tabs/GeneralTab'
import ProveedoresTab from './tabs/ProveedoresTab'
import FinanciamientoTab from './tabs/FinanciamientoTab'
import GarantiasTab from './tabs/GarantiasTab'
import EjecucionTab from './tabs/EjecucionTab'
import RendicionTab from './tabs/RendicionTab'
import HistorialTab from './tabs/HistorialTab'
import BitacoraTab from './tabs/BitacoraTab'
import type {
  BitacoraProyecto,
  DocumentoRequeridoEstadoPago,
  EstadoPagoProyecto,
  GarantiaProyecto,
  HistorialEvento,
  ProyectoFicha,
  RendicionProyecto,
  TransferenciaProyecto,
} from '../../lib/project-types'

const tabs = [
  { key: 'general', label: 'General' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'ejecucion', label: 'Ejecución' },
  { key: 'financiamiento', label: 'Financiamiento' },
  { key: 'rendicion', label: 'Rendición' },
  { key: 'garantias', label: 'Garantías' },
  { key: 'bitacora', label: 'Bitácora' },
  { key: 'historial', label: 'Historial' },
] as const

type TabKey = (typeof tabs)[number]['key']
type TabPermissions = Record<TabKey, boolean>

export default function ProyectoTabs({
  proyecto,
  documentosRequeridosEstadoPago,
  tab,
  descripcionProyecto,
  visualization,
  transferencias,
  garantias,
  estadosPago,
  rendiciones,
  historial,
  bitacora,
  tabPermissions,
}: {
  proyecto: ProyectoFicha
  documentosRequeridosEstadoPago: DocumentoRequeridoEstadoPago[]
  tab: string
  descripcionProyecto?: string | null
  visualization?: {
    referenceUrl: string
    generatedUrls: string[]
    referencePrompt: string
    userInstructions: string
    generatedAt: string
  } | null
  tabPermissions: TabPermissions
  transferencias: TransferenciaProyecto[]
  garantias: GarantiaProyecto[]
  estadosPago: EstadoPagoProyecto[]
  rendiciones: RendicionProyecto[]
  historial: HistorialEvento[]
  bitacora: BitacoraProyecto[]
}) {
  const router = useRouter()
  const visibleTabs = tabs.filter((item) => tabPermissions[item.key])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Barra de pestañas */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '0 20px',
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 28,
            minWidth: 'max-content',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {visibleTabs.map((t) => {
            const active = tab === t.key

            return (
              <button
                key={t.key}
                onClick={() =>
                  router.push(`/cartera-proyectos/${proyecto.id}?tab=${t.key}`)
                }
                style={{
                  padding: '18px 2px 16px 2px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: active
                    ? '3px solid #2563eb'
                    : '3px solid transparent',
                  fontWeight: active ? 700 : 600,
                  fontSize: 15,
                  color: active ? '#2563eb' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido del tab */}
  <RenderTab
  proyecto={proyecto}
  documentosRequeridosEstadoPago={documentosRequeridosEstadoPago}
  tab={tab}
  descripcionProyecto={descripcionProyecto}
  visualization={visualization}
  transferencias={transferencias}
  garantias={garantias}
  estadosPago={estadosPago}
  rendiciones={rendiciones}
  historial={historial}
  bitacora={bitacora}
  tabPermissions={tabPermissions}
/>
    </div>
  )
}

function RenderTab({
  proyecto,
  documentosRequeridosEstadoPago,
  tab,
  descripcionProyecto,
  visualization,
  transferencias,
  garantias,
  estadosPago,
  rendiciones,
  historial,
  bitacora,
  tabPermissions,
}: {
  proyecto: ProyectoFicha
  documentosRequeridosEstadoPago: DocumentoRequeridoEstadoPago[]
  tab: string
  descripcionProyecto?: string | null
  visualization?: {
    referenceUrl: string
    generatedUrls: string[]
    referencePrompt: string
    userInstructions: string
    generatedAt: string
  } | null
  transferencias: TransferenciaProyecto[]
  garantias: GarantiaProyecto[]
  estadosPago: EstadoPagoProyecto[]
  rendiciones: RendicionProyecto[]
  historial: HistorialEvento[]
  bitacora: BitacoraProyecto[]
  tabPermissions: TabPermissions

}) {
    if (!tabPermissions[tab as TabKey]) {
      return (
        <div style={emptyStateStyle}>
          No tienes permisos para ver esta pestaña.
        </div>
      )
    }

    if (tab === 'general') {
        return (
          <GeneralTab
            proyecto={proyecto}
            descripcionProyecto={descripcionProyecto}
            visualization={visualization}
          />
        )
      }

      if (tab === 'proveedores') {
        return <ProveedoresTab proyecto={proyecto} bitacora={bitacora} />
      }
      
      if (tab === 'financiamiento') {
        return (
          <FinanciamientoTab
            proyecto={proyecto}
            transferencias={transferencias}
          />
        )
      }

      if (tab === 'garantias') {
        return (
          <GarantiasTab
            proyecto={proyecto}
            garantias={garantias}
          />
        )
      }

      if (tab === 'ejecucion') {
        return (
          <EjecucionTab
            proyecto={proyecto}
            estadosPago={estadosPago}
            documentosRequeridos={documentosRequeridosEstadoPago}
          />
        )
      }

      if (tab === 'rendicion') {
        return (
          <RendicionTab
            proyecto={proyecto}
            estadosPago={estadosPago}
            rendiciones={rendiciones}
          />
        )
      }

      if (tab === 'historial') {
        return (
          <HistorialTab
            proyecto={proyecto}
            historial={historial}
          />
        )
      }

      if (tab === 'bitacora') {
        return (
          <BitacoraTab
            proyecto={proyecto}
            bitacora={bitacora}
          />
        )
      }

  return (
    <div style={emptyStateStyle}>
      <h2
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--text-strong)',
        }}
      >
        {getTabTitle(tab)}
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: 15,
          color: '#6b7280',
          lineHeight: 1.6,
        }}
      >
        Este submódulo está listo para ser construido con datos reales del proyecto.
      </p>
    </div>
  )
}

function getTabTitle(tab: string) {
  if (tab === 'ejecucion') return 'Ejecución'
  if (tab === 'proveedores') return 'Proveedores'
  if (tab === 'financiamiento') return 'Financiamiento'
  if (tab === 'rendicion') return 'Rendición'
  if (tab === 'garantias') return 'Garantías'
  if (tab === 'bitacora') return 'Bitácora'
  if (tab === 'historial') return 'Historial'
  return 'General'
}

const emptyStateStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 20,
  padding: 28,
  border: '1px solid #e5e7eb',
}
