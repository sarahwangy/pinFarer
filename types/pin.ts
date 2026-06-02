export type PinStatus = 'visited' | 'watchlist' | 'dream'
export type PinSource = 'youtube' | 'wechat' | 'xiaohongshu' | 'book' | 'self' | 'unknown'

export interface Pin {
  id: string
  user_id: string | null
  name: string
  country: string | null
  region: string | null
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
  source_url: string | null
  notes: string | null
  ai_summary: string | null
  created_at: string
}

export interface ParsedPin {
  name: string
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
}
