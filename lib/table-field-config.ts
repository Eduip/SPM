import type {
  TableFieldCellConfig,
  TableFieldColumnConfig,
  TableFieldConfig,
  TableFieldItemConfig,
  TableFieldRowConfig,
} from './formulacion-types'

function safeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createDefaultTableFieldConfig(): TableFieldConfig {
  const columns: TableFieldColumnConfig[] = [
    { id: safeId('col'), header: 'Columna 1' },
    { id: safeId('col'), header: 'Columna 2' },
  ]

  const rows: TableFieldRowConfig[] = [
    {
      id: safeId('row'),
      cells: columns.map((column, index) => ({
        id: safeId(`cell-${column.id}`),
        colspan: 1,
        items: [
          {
            id: safeId('item'),
            kind: index === 0 ? 'static_text' : 'input_text',
            text: index === 0 ? 'Texto de referencia' : '',
            label: index === 0 ? null : 'Dato',
            placeholder: index === 0 ? null : 'Ingrese contenido',
            highlighted: false,
          },
        ],
      })),
    },
  ]

  return { columns, rows }
}

export function normalizeTableFieldConfig(value: unknown): TableFieldConfig {
  const fallback = createDefaultTableFieldConfig()

  if (!value || typeof value !== 'object') return fallback

  const config = value as Partial<TableFieldConfig>
  const columns = Array.isArray(config.columns) ? config.columns : []
  const rows = Array.isArray(config.rows) ? config.rows : []

  if (columns.length === 0) return fallback

  const normalizedColumns = columns.map((column, index) => ({
    id: column?.id || safeId(`col-${index + 1}`),
    header: String(column?.header || `Columna ${index + 1}`),
  }))

  const normalizedRows = rows.length
    ? rows.map((row, rowIndex) => ({
        id: row?.id || safeId(`row-${rowIndex + 1}`),
        cells: normalizedColumns.map((column, columnIndex) => {
          const sourceCell = Array.isArray(row?.cells) ? row?.cells[columnIndex] : null
          const normalizedItems = Array.isArray(sourceCell?.items)
            ? sourceCell.items.map((item, itemIndex) => normalizeTableItem(item, itemIndex))
            : [createDefaultCellItem(columnIndex)]
          return {
            id: sourceCell?.id || safeId(`cell-${rowIndex + 1}-${column.id}`),
            colspan: normalizeColspan(sourceCell?.colspan),
            items: normalizedItems,
          }
        }),
      }))
    : fallback.rows

  return {
    columns: normalizedColumns,
    rows: normalizedRows,
  }
}

function normalizeColspan(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.max(1, Math.floor(parsed))
}

function normalizeTableItem(item: Partial<TableFieldItemConfig> | null | undefined, index: number) {
  const kind = item?.kind || 'static_text'
  return {
    id: item?.id || safeId(`item-${index + 1}`),
    kind,
    label: item?.label ?? '',
    text: item?.text ?? '',
    placeholder: item?.placeholder ?? '',
    highlighted: Boolean(item?.highlighted),
  }
}

function createDefaultCellItem(columnIndex: number): TableFieldItemConfig {
  return {
    id: safeId('item'),
    kind: columnIndex === 0 ? 'static_text' : 'input_text',
    label: columnIndex === 0 ? '' : 'Dato',
    text: columnIndex === 0 ? 'Texto de referencia' : '',
    placeholder: columnIndex === 0 ? '' : 'Ingrese contenido',
    highlighted: false,
  }
}

export function getTableSumForCell(
  cell: TableFieldCellConfig,
  values: Record<string, string | number | boolean | null | undefined>
) {
  return cell.items.reduce((sum, item) => {
    if (item.kind !== 'input_number') return sum
    const raw = values[item.id]
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? sum + numeric : sum
  }, 0)
}

export function getRenderableTableCells(
  row: TableFieldRowConfig,
  totalColumns: number
) {
  const renderable: Array<{
    cell: TableFieldCellConfig
    cellIndex: number
    colspan: number
  }> = []

  let covered = 0
  let consumedColumns = 0

  for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex += 1) {
    const cell = row.cells[cellIndex]

    if (covered > 0) {
      covered -= 1
      continue
    }

    const remainingColumns = Math.max(totalColumns - consumedColumns, 1)
    const colspan = Math.min(normalizeColspan(cell.colspan), remainingColumns)
    consumedColumns += colspan
    covered = colspan - 1

    renderable.push({
      cell,
      cellIndex,
      colspan,
    })

    if (consumedColumns >= totalColumns) break
  }

  return renderable
}
