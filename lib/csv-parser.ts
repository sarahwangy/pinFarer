export interface CSVRow {
  name: string
  url: string
}

export function parseGoogleMapsCSV(text: string): CSVRow[] {
  // Remove BOM if present
  const clean = text.replace(/^﻿/, '')

  // Split lines, handle both \r\n and \n
  const lines = clean.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Auto-detect separator: tab or comma
  const firstLine = lines[0]
  const sep = firstLine.includes('\t') ? '\t' : ','

  // Find header row (contains "title" or "Title")
  const headerIdx = lines.findIndex(l => l.toLowerCase().includes('title'))
  if (headerIdx === -1) return []

  // Parse header to find column indices dynamically
  const headers = lines[headerIdx].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const titleIdx = headers.findIndex(h => h === 'title')
  const urlIdx   = headers.findIndex(h => h === 'url')

  if (titleIdx === -1 || urlIdx === -1) return []

  const rows: CSVRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    const name = cols[titleIdx]
    const url  = cols[urlIdx]
    // Skip rows without a valid URL (e.g. tag-only rows like "澳洲🦘")
    if (!name || !url || !url.startsWith('http')) continue
    rows.push({ name, url })
  }
  return rows
}
