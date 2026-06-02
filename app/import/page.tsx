'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { parseKML } from '@/lib/kml-parser'
import { parseGeoJSON } from '@/lib/geojson-parser'
import { parseGoogleMapsCSV } from '@/lib/csv-parser'
import ImportTable from '@/components/ImportTable'
import type { ParsedPin, PinSource, PinStatus } from '@/types/pin'

const SOURCES: { value: PinSource; label: string }[] = [
  { value: 'unknown',     label: '未知' },
  { value: 'youtube',     label: '▶ YouTube' },
  { value: 'wechat',      label: '📱 微信公众号' },
  { value: 'xiaohongshu', label: '📱 小红书' },
  { value: 'book',        label: '📖 书籍' },
  { value: 'self',        label: '✦ 自己探索' },
]

type ImportMode = 'idle' | 'geocoding' | 'importing' | 'done'

export default function ImportPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ParsedPin[]>([])
  const [source, setSource] = useState<PinSource>('unknown')
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<ImportMode>('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text()
    const name = file.name.toLowerCase()

    if (name.endsWith('.kml')) {
      setRows(parseKML(text))
    } else if (name.endsWith('.json')) {
      setRows(parseGeoJSON(text))
    } else if (name.endsWith('.csv')) {
      // CSV needs geocoding
      const csvRows = parseGoogleMapsCSV(text)
      console.log('[CSV] parsed rows:', csvRows.length, csvRows.slice(0, 3))
      if (!csvRows.length) {
        alert('未能解析 CSV 文件，请确认是 Google Maps 导出的格式（包含 Title 和 URL 列）')
        return
      }
      setMode('geocoding')
      setProgress(0)

      const results: ParsedPin[] = []
      for (let i = 0; i < csvRows.length; i++) {
        setProgressLabel(`正在查询坐标 ${i + 1} / ${csvRows.length}：${csvRows[i].name}`)
        setProgress(Math.round((i / csvRows.length) * 100))

        const res = await fetch(`/api/geocode?name=${encodeURIComponent(csvRows[i].name)}`)
        const data = await res.json()

        if (data.found) {
          results.push({
            name: csvRows[i].name,
            lat: data.lat,
            lng: data.lng,
            status: 'watchlist',
            source: 'unknown',
            country: data.country,
          })
        }
        // Rate limit: 1 req/sec for Nominatim
        await new Promise(r => setTimeout(r, 1100))
      }

      setProgress(100)
      setMode('idle')
      setProgressLabel('')
      setRows(results)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const updateRowStatus = useCallback((index: number, newStatus: PinStatus) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, status: newStatus } : r))
  }, [])

  const handleImport = async () => {
    setMode('importing')
    setProgress(0)
    const body = rows.map(r => ({
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      status: r.status,
      source,
      country: r.country ?? null,
    }))

    const BATCH = 100
    const batches = Math.ceil(body.length / BATCH)
    for (let i = 0; i < batches; i++) {
      const chunk = body.slice(i * BATCH, (i + 1) * BATCH)
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      })
      if (!res.ok) {
        setMode('idle')
        alert(`第 ${i + 1} 批导入失败，请重试`)
        return
      }
      setProgress(Math.round(((i + 1) / batches) * 100))
    }

    setMode('done')
    setTimeout(() => router.push('/'), 1200)
  }

  const isWorking = mode === 'geocoding' || mode === 'importing'

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
        border-b border-black/[0.07] shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)]" />
          Pinfarer
        </div>
        <button onClick={() => router.push('/')}
          className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
          ← 返回地图
        </button>
      </nav>

      <div className="max-w-3xl mx-auto pt-[86px] pb-12 px-6">
        <h1 className="font-serif text-[28px] font-bold text-[var(--ink)] mb-1">
          从 <em className="italic text-[var(--forest)]">Google 地图</em> 导入
        </h1>
        <p className="text-[13px] text-[var(--muted)] mb-6">
          支持 Google Takeout 导出的 JSON、CSV 文件，以及 KML 文件
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed text-center px-6 py-12
            transition-all mb-6 overflow-hidden
            ${isWorking ? 'cursor-default border-black/10 bg-white'
              : isDragging ? 'cursor-copy border-[var(--forest)] bg-[var(--forest)]/5'
              : 'cursor-pointer border-black/15 bg-white hover:border-[var(--forest)]/50'
            }`}
        >
          {/* Invisible full-area file input — most reliable cross-browser approach */}
          {!isWorking && (
            <input
              type="file"
              accept=".kml,.json,.csv"
              aria-label="上传文件"
              onChange={onFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          )}
          <div className="text-4xl mb-3">📍</div>
          <div className="font-serif text-[18px] font-semibold text-[var(--ink)] mb-1.5">
            将文件拖拽到此处
          </div>
          <div className="text-[13px] text-[var(--muted)]">
            或 <span className="text-[var(--forest)] font-semibold">点击选择文件</span>
          </div>
          <div className="mt-3 flex justify-center gap-2 items-center flex-wrap">
            {['.json (Saved Places)', '.csv (列表)', '.kml'].map(f => (
              <span key={f} className="text-[11px] bg-black/[0.06] px-2 py-0.5 rounded font-semibold text-[var(--muted)]">{f}</span>
            ))}
          </div>
        </div>

        {/* Progress (geocoding or importing) */}
        {isWorking && (
          <div className="mb-6 bg-white rounded-2xl p-5 border border-black/[0.07]">
            <div className="flex justify-between text-[13px] font-medium text-[var(--ink)] mb-2">
              <span>{mode === 'geocoding' ? '正在查询坐标…' : '正在导入…'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-black/[0.08] rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[var(--forest)] rounded-full transition-[width] duration-300"
                style={{ width: `${progress}%` }} />
            </div>
            {progressLabel && (
              <p className="text-[11px] text-[var(--muted)] truncate">{progressLabel}</p>
            )}
            {mode === 'geocoding' && (
              <p className="text-[11px] text-[var(--muted)] mt-1">
                每秒查询1个地点，请耐心等待…
              </p>
            )}
          </div>
        )}

        {/* Source selector */}
        {rows.length > 0 && !isWorking && (
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <span className="text-[13px] font-semibold text-[var(--ink)]">默认来源：</span>
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map(s => (
                <button key={s.value} onClick={() => setSource(s.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all
                    ${source === s.value
                      ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                      : 'bg-white text-[var(--muted)] border-black/10 hover:border-black/25'
                    }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ImportTable rows={rows} onChange={updateRowStatus} />

        {rows.length > 0 && !isWorking && (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl border border-black/15 text-[14px] font-semibold
                text-[var(--ink)] hover:border-black/30 transition-colors">
              取消
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={mode !== 'idle'}
              className={`px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all
                ${mode === 'done' ? 'bg-[var(--mint)]'
                  : 'bg-[var(--forest)] hover:bg-[#245a41] hover:-translate-y-px'
                }`}>
              {mode === 'done' ? '✓ 导入成功！' : `导入 ${rows.length} 个地点 →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
