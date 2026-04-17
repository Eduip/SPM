type CsvValue = string | number | boolean | null | undefined

export function exportRowsToCsv(
  filename: string,
  rows: Record<string, CsvValue>[]
) {
  const headers = Object.keys(rows[0] ?? {})
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
