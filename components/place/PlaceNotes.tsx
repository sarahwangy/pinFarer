'use client'
import { useState } from 'react'

interface PlaceNotesProps {
  pinId: string
  initialNotes: string | null
}

export default function PlaceNotes({ pinId, initialNotes }: PlaceNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: draft }),
    })
    if (res.ok) { setNotes(draft); setEditing(false) }
    setSaving(false)
  }

  const handleCancel = () => {
    setDraft(notes)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          个人备注
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12px] text-[var(--coral)] font-semibold hover:opacity-70 transition-opacity"
          >
            {notes ? '编辑' : '+ 添加备注'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="写下你对这个地方的想法…"
            rows={4}
            className="w-full px-3 py-2.5 text-[13px] rounded-xl border border-black/10
              bg-[var(--sand)] text-[var(--ink)] placeholder:text-[var(--muted)]
              outline-none focus:border-[var(--coral)] transition-colors resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleCancel}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg
                border border-black/15 text-[var(--muted)] hover:border-black/30 transition-colors">
              取消
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg
                bg-[var(--coral)] text-white hover:bg-[#d4623e] transition-colors disabled:opacity-60">
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
          {notes || <span className="text-[var(--muted)]">暂无备注，点击添加…</span>}
        </p>
      )}
    </div>
  )
}
