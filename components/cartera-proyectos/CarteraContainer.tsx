'use client'

import { useMemo, useState } from 'react'
import type { ProyectoCartera } from '../../app/cartera-proyectos/page'
import CarteraHeader from './CarteraHeader'
import CarteraStats from './CarteraStats'
import CarteraFilters from './CarteraFilters'
import CarteraTable from './CarteraTable'

export default function CarteraContainer({
  proyectos,
}: {
  proyectos: ProyectoCartera[]
}) {
  const [estado, setEstado] = useState('Todos')
  const [unidad, setUnidad] = useState('Todas')
  const [fuente, setFuente] = useState('Todas')
  const [anio, setAnio] = useState('Todos')

  const unidades = useMemo(() => {
    return Array.from(
      new Set(
        proyectos
          .map((p) => p.unidad?.nombre)
          .filter(Boolean)
      )
    ) as string[]
  }, [proyectos])

  const fuentes = useMemo(() => {
    return Array.from(
      new Set(
        proyectos
          .map((p) => p.fuente?.nombre)
          .filter(Boolean)
      )
    ) as string[]
  }, [proyectos])

  const anios = useMemo(() => {
    return Array.from(
      new Set(
        proyectos
          .map((p) => p.anio_inicio)
          .filter((v): v is number => typeof v === 'number')
      )
    ).sort((a, b) => b - a)
  }, [proyectos])

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchEstado =
        estado === 'Todos' ||
        normalizarEstado(p) === estado

      const matchUnidad =
        unidad === 'Todas' || p.unidad?.nombre === unidad

      const matchFuente =
        fuente === 'Todas' || p.fuente?.nombre === fuente

      const matchAnio =
        anio === 'Todos' || String(p.anio_inicio ?? '') === anio

      return matchEstado && matchUnidad && matchFuente && matchAnio
    })
  }, [proyectos, estado, unidad, fuente, anio])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <CarteraHeader />
      <CarteraFilters
        estado={estado}
        setEstado={setEstado}
        unidad={unidad}
        setUnidad={setUnidad}
        fuente={fuente}
        setFuente={setFuente}
        anio={anio}
        setAnio={setAnio}
        unidades={unidades}
        fuentes={fuentes}
        anios={anios}
      />
      <CarteraStats proyectos={proyectosFiltrados} />
      <CarteraTable proyectos={proyectosFiltrados} />
    </div>
  )
}

function normalizarEstado(p: ProyectoCartera) {
  if (p.estado === 'aprobado') return 'Aprobado'
  if ((p.porcentaje_formulacion ?? 0) < 100) return 'En Formulación'
  if ((p.avance_fisico_actual ?? 0) > 0) return 'En Ejecución'
  return 'Pendiente'
}