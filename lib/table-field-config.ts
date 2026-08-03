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
          return {
            id: sourceCell?.id || safeId(`cell-${rowIndex + 1}-${column.id}`),
            items: Array.isArray(sourceCell?.items) && sourceCell.items.length > 0
              ? sourceCell.items.map((item, itemIndex) => normalizeTableItem(item, itemIndex))
              : [createDefaultCellItem(columnIndex)],
          }
        }),
      }))
    : fallback.rows

  return {
    columns: normalizedColumns,
    rows: normalizedRows,
  }
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
