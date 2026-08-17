import type {
  TableFieldCellAlign,
  TableFieldCellBackground,
  TableFieldCellConfig,
  TableFieldColumnConfig,
  TableFieldConfig,
  TableFieldCellVerticalAlign,
  TableFieldItemConfig,
  TableFieldRowConfig,
} from './formulacion-types'

function safeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

type TableCellPresentation = {
  background: string
  textAlign: TableFieldCellAlign
  verticalAlign: TableFieldCellVerticalAlign
  justifyContent: 'flex-start' | 'center' | 'flex-end'
  fontWeight: number
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
        background: index === 0 ? 'soft_blue' : 'default',
        align: index === 0 ? 'center' : 'left',
        vertical_align: index === 0 ? 'middle' : 'top',
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

export function createDefaultGanttTableFieldConfig(months = 12): TableFieldConfig {
  const columns: TableFieldColumnConfig[] = [
    { id: safeId('col'), header: 'Componente / tramo' },
    { id: safeId('col'), header: 'Acción / actividad' },
    ...Array.from({ length: months }, (_, index) => ({
      id: safeId('col'),
      header: `Mes ${index + 1}`,
    })),
  ]

  const createMonthCells = () =>
    Array.from({ length: months }, (_, index) => ({
      id: safeId(`cell-month-${index + 1}`),
      colspan: 1,
      background: 'default' as const,
      align: 'center' as const,
      vertical_align: 'top' as const,
      items: [
        {
          id: safeId(`item-month-${index + 1}`),
          kind: 'gantt_mark' as const,
          label: '',
          text: '',
          placeholder: '',
          highlighted: false,
        },
      ],
    }))

  const rows: TableFieldRowConfig[] = [
    {
      id: safeId('row'),
      variant: 'body',
      cells: [
        {
          id: safeId('cell-component'),
          colspan: 1,
          background: 'soft_blue',
          align: 'center',
          vertical_align: 'middle',
          items: [
            {
              id: safeId('item-component'),
              kind: 'static_text',
              text: 'COMPONENTE 1',
              label: '',
              placeholder: '',
              highlighted: false,
            },
          ],
        },
        {
          id: safeId('cell-activity'),
          colspan: 1,
          background: 'default',
          align: 'left',
          vertical_align: 'top',
          items: [
            {
              id: safeId('item-activity'),
              kind: 'static_text',
              text: 'Actividad 1',
              label: '',
              placeholder: '',
              highlighted: false,
            },
          ],
        },
        ...createMonthCells(),
      ],
    },
    {
      id: safeId('row'),
      variant: 'body',
      cells: [
        {
          id: safeId('cell-component'),
          colspan: 1,
          background: 'soft_blue',
          align: 'center',
          vertical_align: 'middle',
          items: [
            {
              id: safeId('item-component'),
              kind: 'static_text',
              text: 'COMPONENTE 1',
              label: '',
              placeholder: '',
              highlighted: false,
            },
          ],
        },
        {
          id: safeId('cell-activity'),
          colspan: 1,
          background: 'default',
          align: 'left',
          vertical_align: 'top',
          items: [
            {
              id: safeId('item-activity'),
              kind: 'static_text',
              text: 'Actividad 2',
              label: '',
              placeholder: '',
              highlighted: false,
            },
          ],
        },
        ...createMonthCells(),
      ],
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

  const normalizedRows: TableFieldRowConfig[] = rows.length
    ? rows.map((row, rowIndex) => ({
        id: row?.id || safeId(`row-${rowIndex + 1}`),
        variant: normalizeRowVariant(row?.variant),
        cells: normalizedColumns.map((column, columnIndex) => {
          const sourceCell = Array.isArray(row?.cells) ? row?.cells[columnIndex] : null
          const normalizedItems = Array.isArray(sourceCell?.items)
            ? sourceCell.items.map((item, itemIndex) => normalizeTableItem(item, itemIndex))
            : [createDefaultCellItem(columnIndex)]
          return {
            id: sourceCell?.id || safeId(`cell-${rowIndex + 1}-${column.id}`),
            colspan: normalizeColspan(sourceCell?.colspan),
            background: normalizeCellBackground(sourceCell?.background),
            align: normalizeCellAlign(sourceCell?.align),
            vertical_align: normalizeCellVerticalAlign(sourceCell?.vertical_align),
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

function normalizeRowVariant(value: unknown): 'body' | 'header' {
  return value === 'header' ? 'header' : 'body'
}

function normalizeCellBackground(value: unknown): TableFieldCellBackground {
  return value === 'header' || value === 'soft_blue' ? value : 'default'
}

function normalizeCellAlign(value: unknown): TableFieldCellAlign {
  return value === 'center' || value === 'right' ? value : 'left'
}

function normalizeCellVerticalAlign(value: unknown): TableFieldCellVerticalAlign {
  return value === 'middle' || value === 'bottom' ? value : 'top'
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

export function getTableCellPresentation(
  row: TableFieldRowConfig,
  cell: TableFieldCellConfig
): TableCellPresentation {
  const rowIsHeader = row.variant === 'header'
  const background =
    rowIsHeader || cell.background === 'header'
      ? '#d8e6f5'
      : cell.background === 'soft_blue'
        ? '#eef5ff'
        : '#ffffff'
  const textAlign =
    (rowIsHeader || cell.background === 'header') && (cell.align ?? 'left') === 'left'
      ? 'center'
      : (cell.align ?? 'left')
  const verticalAlign =
    rowIsHeader || cell.background === 'header'
      ? cell.vertical_align === 'top' || cell.vertical_align === 'bottom'
        ? cell.vertical_align
        : 'middle'
      : (cell.vertical_align ?? 'top')
  const justifyContent =
    verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start'

  return {
    background,
    textAlign,
    verticalAlign,
    justifyContent,
    fontWeight: rowIsHeader || cell.background === 'header' ? 800 : 500,
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

export function removeTableRow(config: TableFieldConfig, rowIndex: number): TableFieldConfig {
  const normalized = normalizeTableFieldConfig(config)

  if (normalized.rows.length <= 1) {
    return normalized
  }

  return {
    ...normalized,
    rows: normalized.rows.filter((_, index) => index !== rowIndex),
  }
}

export function removeTableColumn(
  config: TableFieldConfig,
  columnIndex: number
): TableFieldConfig {
  const normalized = normalizeTableFieldConfig(config)

  if (normalized.columns.length <= 1) {
    return normalized
  }

  const nextColumns = normalized.columns.filter((_, index) => index !== columnIndex)
  const nextRows = normalized.rows.map((row) => ({
    ...row,
    cells: removeColumnFromRow(row, normalized.columns.length, columnIndex),
  }))

  return normalizeTableFieldConfig({
    columns: nextColumns,
    rows: nextRows,
  })
}

function removeColumnFromRow(
  row: TableFieldRowConfig,
  totalColumns: number,
  columnIndexToRemove: number
): TableFieldCellConfig[] {
  const slots: TableFieldCellConfig[] = []
  const renderable = getRenderableTableCells(row, totalColumns)

  for (const { cell, colspan } of renderable) {
    for (let slotIndex = 0; slotIndex < colspan; slotIndex += 1) {
      slots.push(cell)
    }
  }

  while (slots.length < totalColumns) {
    slots.push(createFallbackCellForRemoval(slots.length))
  }

  slots.splice(columnIndexToRemove, 1)

  const compressed: TableFieldCellConfig[] = []
  let current: TableFieldCellConfig | null = null
  let span = 0

  const flush = () => {
    if (!current) return
    compressed.push({
      ...current,
      colspan: span,
    })
    current = null
    span = 0
  }

  for (const slot of slots) {
    if (!current || current.id !== slot.id) {
      flush()
      current = slot
      span = 1
    } else {
      span += 1
    }
  }

  flush()

  return compressed
}

function createFallbackCellForRemoval(columnIndex: number): TableFieldCellConfig {
  return {
    id: safeId(`cell-fallback-${columnIndex + 1}`),
    colspan: 1,
    background: 'default',
    align: 'left',
    vertical_align: 'top',
    items: [createDefaultCellItem(columnIndex)],
  }
}
