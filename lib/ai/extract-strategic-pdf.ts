import { PDFParse } from 'pdf-parse'
import type { StrategicDocument } from './strategic-documents'

type ExtractedStrategicPdf = {
  pageCount: number
  chunks: StrategicDocument['chunks']
}

export async function extractStrategicPdf(buffer: Buffer): Promise<ExtractedStrategicPdf> {
  const pages = await extractPages(buffer)
  const sections: StrategicDocument['chunks'] = []
  let current: StrategicDocument['chunks'][number] | null = null

  for (const page of pages) {
    const lines = page.text
      .split('\n')
      .map(normalizeSpaces)
      .filter(Boolean)

    for (const line of lines) {
      if (isHeading(line)) {
        if (current?.content.trim()) {
          sections.push(current)
        }

        current = {
          id: `chunk-${sections.length + 1}`,
          title: line,
          content: '',
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
          keywords: [],
        }
        continue
      }

      if (!current) {
        current = {
          id: `chunk-${sections.length + 1}`,
          title: `Sección inicial página ${page.pageNumber}`,
          content: '',
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
          keywords: [],
        }
      }

      current.content = normalizeSpaces(`${current.content} ${line}`)
      current.pageEnd = page.pageNumber
    }
  }

  if (current?.content.trim()) {
    sections.push(current)
  }

  const chunks = sections.map((section, index) => ({
    ...section,
    id: `chunk-${index + 1}`,
    keywords: extractKeywords(section.title, section.content),
  }))

  return {
    pageCount: pages.length,
    chunks,
  }
}

async function extractPages(buffer: Buffer) {
  const pages: Array<{ pageNumber: number; text: string }> = []
  const parser = new PDFParse({ data: buffer })

  try {
    const info = await parser.getInfo()

    for (let pageNumber = 1; pageNumber <= info.total; pageNumber += 1) {
      const result = await parser.getText({
        partial: [pageNumber],
        pageJoiner: '',
      })

      pages.push({
        pageNumber,
        text: result.text ?? '',
      })
    }
  } finally {
    await parser.destroy()
  }

  return pages
}

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function isHeading(line: string) {
  const cleaned = line.trim()

  if (cleaned.length < 4 || cleaned.length > 120) return false
  if (/^\d+(\.\d+)*\s+.+/.test(cleaned)) return true
  if (cleaned === cleaned.toUpperCase() && cleaned.split(/\s+/).length <= 14) return true
  if (cleaned.endsWith(':') && cleaned.split(/\s+/).length <= 12) return true
  if (
    cleaned.startsWith('CAPITULO') ||
    cleaned.startsWith('CAPÍTULO') ||
    cleaned.startsWith('EJE') ||
    cleaned.startsWith('LINEA') ||
    cleaned.startsWith('LÍNEA') ||
    cleaned.startsWith('TEMA') ||
    cleaned.startsWith('DIMENSION') ||
    cleaned.startsWith('DIMENSIÓN')
  ) {
    return true
  }

  return false
}

function extractKeywords(title: string, content: string) {
  const words = `${title} ${content}`.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}/g) ?? []
  const seen: string[] = []

  for (const word of words) {
    const normalized = word.toLowerCase()
    if (!seen.includes(normalized)) {
      seen.push(normalized)
    }

    if (seen.length >= 12) break
  }

  return seen
}
