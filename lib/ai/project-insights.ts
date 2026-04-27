import type { ProjectAIContext } from './project-context'

export function buildLocalProjectAssistantAnswer({
  question,
  context,
}: {
  question: string
  context: ProjectAIContext
}) {
  const normalizedQuestion = normalize(question)
  const lines: string[] = []

  if (matchesAny(normalizedQuestion, ['documento', 'faltan', 'faltante'])) {
    const docs = context.formulacion?.documentos

    if (!docs) {
      return deniedAnswer('documentos del proyecto')
    }

    if (docs.faltantes.length === 0) {
      lines.push('No aparecen documentos obligatorios pendientes para la fuente seleccionada.')
    } else {
      lines.push(`Faltan ${docs.faltantes.length} documento(s) obligatorio(s):`)
      docs.faltantes.forEach((doc) => lines.push(`- ${doc.nombre}`))
    }
  } else if (matchesAny(normalizedQuestion, ['rendicion', 'rendición', 'rendir'])) {
    const rendiciones = context.rendiciones

    if (!rendiciones) {
      return deniedAnswer('rendiciones')
    }

    lines.push(`Rendiciones registradas: ${rendiciones.rendiciones.length}.`)
    lines.push(`Rendiciones abiertas: ${rendiciones.abiertas}.`)
    lines.push(`Rendiciones observadas: ${rendiciones.observadas}.`)
    lines.push(`Total rendido: ${formatCurrency(rendiciones.totalRendido)}.`)
  } else if (matchesAny(normalizedQuestion, ['garantia', 'garantía', 'vencer', 'vencida'])) {
    const garantias = context.garantias

    if (!garantias) {
      return deniedAnswer('garantías')
    }

    lines.push(`Garantías registradas: ${garantias.garantias.length}.`)
    lines.push(`Vencidas: ${garantias.vencidas}.`)
    lines.push(`Por vencer en menos de 30 días: ${garantias.porVencer}.`)
  } else if (matchesAny(normalizedQuestion, ['pago', 'ejecucion', 'ejecución'])) {
    const ejecucion = context.ejecucion

    if (!ejecucion) {
      return deniedAnswer('ejecución')
    }

    lines.push(`Estados de pago registrados: ${ejecucion.estadosPago.length}.`)
    lines.push(`Pagos pendientes: ${ejecucion.pagosPendientes}.`)
    lines.push(`Total pagado: ${formatCurrency(ejecucion.totalPagado)}.`)
  } else {
    lines.push(`El proyecto "${context.proyecto.nombre}" está en estado "${context.proyecto.estado}".`)
    lines.push(`Avance de formulación: ${context.proyecto.porcentajeFormulacion}%.`)
    lines.push(`Avance físico: ${context.proyecto.avanceFisico}%.`)
    lines.push(`Avance financiero: ${context.proyecto.avanceFinanciero}%.`)
    lines.push(`Presupuesto total registrado: ${formatCurrency(context.proyecto.presupuestoTotal)}.`)
  }

  const nextStep = getNextStep(context)
  if (nextStep) {
    lines.push('')
    lines.push(`Próximo paso sugerido: ${nextStep}`)
  }

  if (context.deniedSections.length > 0) {
    lines.push('')
    lines.push('Nota: omití información de secciones para las que este usuario no tiene permiso.')
  }

  return lines.join('\n')
}

function getNextStep(context: ProjectAIContext) {
  const missingDocuments = context.formulacion?.documentos.faltantes ?? []
  if (missingDocuments.length > 0) {
    return 'adjuntar los documentos obligatorios faltantes antes de avanzar.'
  }

  if (context.rendiciones && context.rendiciones.abiertas > 0) {
    return 'revisar las rendiciones abiertas y resolver observaciones si existen.'
  }

  if (context.garantias && (context.garantias.vencidas > 0 || context.garantias.porVencer > 0)) {
    return 'revisar las garantías vencidas o próximas a vencer.'
  }

  if (context.ejecucion && context.ejecucion.pagosPendientes > 0) {
    return 'revisar los estados de pago pendientes.'
  }

  return 'mantener actualizado el historial, documentos y bitácora del proyecto.'
}

function deniedAnswer(section: string) {
  return `No tengo acceso a la información de ${section} con los permisos actuales del usuario.`
}

function matchesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(normalize(term)))
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}
