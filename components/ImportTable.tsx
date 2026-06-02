'use client'
import type { ParsedPin, PinStatus } from '@/types/pin'

interface ImportTableProps {
  rows: ParsedPin[]
  onChange: (index: number, status: PinStatus) => void
}

const STATUS_OPTIONS: PinStatus[] = ['watchlist', 'visited', 'dream']
const STATUS_LABELS: Record<PinStatus, string> = {
  watchlist: '想去',
  visited:   '已到访',
  dream:     '梦想',
}

export default function ImportTable({ rows, onChange }: ImportTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden mb-5">
      <div className="px-[18px] py-3.5 border-b border-black/[0.07] flex items-center justify-between">
        <h3 className="font-serif text-[15px] font-semibold text-[var(--ink)]">
          预览 — 解析到 {rows.length} 个地点
        </h3>
        <span className="text-[12px] text-[var(--muted)]">导入前可逐条修改状态</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.025]">
              {['#', '地点名称', '坐标', '状态'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold
                  uppercase tracking-[0.07em] text-[var(--muted)] border-b border-black/[0.07]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5 text-[13px] text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]">{row.name}</td>
                <td className="px-4 py-2.5 text-[11px] text-[var(--muted)] font-mono">
                  {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={row.status}
                    onChange={e => onChange(i, e.target.value as PinStatus)}
                    className="px-2 py-1 rounded-lg border border-black/10 text-[12px]
                      font-medium text-[var(--ink)] bg-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
