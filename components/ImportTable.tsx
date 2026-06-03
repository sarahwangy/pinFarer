'use client'
import { useState } from 'react'
import type { ParsedPin, PinStatus } from '@/types/pin'

interface ImportTableProps {
  rows: ParsedPin[]
  onChangeStatus: (index: number, status: PinStatus) => void
  onBulkStatus: (status: PinStatus) => void
  onBulkTag: (tag: string) => void
}

const STATUS_OPTIONS: PinStatus[] = ['watchlist', 'visited', 'dream']
const STATUS_LABELS: Record<PinStatus, string> = {
  watchlist: '想去',
  visited:   '已到访',
  dream:     '梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  watchlist: 'bg-[#F59E2A]/15 text-amber-700 border-[#F59E2A]/30',
  visited:   'bg-[#2ECC8A]/15 text-emerald-700 border-[#2ECC8A]/30',
  dream:     'bg-[#8B7FD4]/15 text-purple-700 border-[#8B7FD4]/30',
}

const PREVIEW_LIMIT = 20

export default function ImportTable({ rows, onChangeStatus, onBulkStatus, onBulkTag }: ImportTableProps) {
  const [tagInput, setTagInput] = useState('')

  if (rows.length === 0) return null

  const preview = rows.slice(0, PREVIEW_LIMIT)
  const hidden = rows.length - PREVIEW_LIMIT

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (!t) return
    onBulkTag(t)
    setTagInput('')
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden mb-5">
      {/* Header */}
      <div className="px-[18px] py-3.5 border-b border-black/[0.07] flex items-center justify-between">
        <h3 className="font-serif text-[15px] font-semibold text-[var(--ink)]">
          预览 — 解析到 {rows.length} 个地点
        </h3>
        <span className="text-[12px] text-[var(--muted)]">
          {hidden > 0 ? `显示前 ${PREVIEW_LIMIT} 条，还有 ${hidden} 条将一并导入` : '导入前可修改状态'}
        </span>
      </div>

      {/* Bulk actions */}
      <div className="px-[18px] py-3 border-b border-black/[0.05] bg-black/[0.015] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--muted)]">全部设为</span>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onBulkStatus(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all
                hover:opacity-80 ${STATUS_COLORS[s]}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-black/10" />
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--muted)]">批量打标签</span>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            placeholder="输入标签名，如「育儿」"
            className="px-3 py-1 text-[12px] rounded-lg border border-black/10 bg-white
              text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
              focus:border-[var(--coral)] transition-colors w-40"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-1 rounded-lg bg-[var(--ink)] text-white text-[11px] font-semibold
              hover:opacity-80 transition-opacity"
          >
            应用到全部
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.025]">
              {['#', '地点名称', '坐标', '状态', '标签'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold
                  uppercase tracking-[0.07em] text-[var(--muted)] border-b border-black/[0.07]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5 text-[13px] text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]">{row.name}</td>
                <td className="px-4 py-2.5 text-[11px] text-[var(--muted)] font-mono">
                  {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={row.status}
                    onChange={e => onChangeStatus(i, e.target.value as PinStatus)}
                    className="px-2 py-1 rounded-lg border border-black/10 text-[12px]
                      font-medium text-[var(--ink)] bg-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(row.tags ?? []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                        bg-[#8B7FD4]/15 text-purple-700 border border-[#8B7FD4]/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
