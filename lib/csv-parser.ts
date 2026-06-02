export interface CSVRow {
  name: string
  url: string
}

export function parseGoogleMapsCSV(text: string): CSVRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Find header row
  const headerIdx = lines.findIndex(l => l.toLowerCase().startsWith('title'))
  if (headerIdx === -1) return []

  const rows: CSVRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    const name = cols[0]?.trim()
    const url = cols[2]?.trim() // URL is 3rd column
    if (!name || !url || !url.startsWith('http')) continue
    rows.push({ name, url })
  }
  return rows
}
