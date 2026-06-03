'use client'
import { useState } from 'react'
import type { PinStatus } from '@/types/pin'

const OPTIONS: { value: PinStatus; label: string; color: string; active: string }[] = [
  { value: 'visited',   label: '✓ 已到访', color: 'border-[#2ECC8A]/30 text-emerald-700', active: 'bg-[#2ECC8A] text-white border-[#2ECC8A]' },
  { value: 'watchlist', label: '👁 想去',  color: 'border-[#F59E2A]/30 text-amber-700',   active: 'bg-[#F59E2A] text-white border-[#F59E2A]' },
  { value: 'dream',     label: '✨ 梦想',  color: 'border-[#8B7FD4]/30 text-purple-700',  active: 'bg-[#8B7FD4] text-white border-[#8B7FD4]' },
]

interface PlaceStatusProps {
  pinId: string
  initialStatus: PinStatus
}

export default function PlaceStatus({ pinId, initialStatus }: PlaceStatusProps) {
  const [status, setStatus] = useState<PinStatus>(initialStatus)
  const [saving, setSaving] = useState(false)

  const handleChange = async (newStatus: PinStatus) => {
    if (newStatus === status) return
    setSaving(true)
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setStatus(newStatus)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm px-6 py-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
        text-[var(--muted)] mb-3">状态</div>
      <div className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={saving}
            onClick={() => handleChange(opt.value)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border
              transition-all ${status === opt.value ? opt.active : `bg-white ${opt.color} hover:opacity-80`}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
