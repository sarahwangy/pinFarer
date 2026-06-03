export type PinStatus = 'visited' | 'watchlist' | 'dream'
export type PinSource = 'youtube' | 'wechat' | 'xiaohongshu' | 'book' | 'self' | 'unknown'

export interface CityData {
  type: 'city'
  population: string
  language: string
  language_is_english: boolean
  currency: string
  timezone: string
  climate: string
  best_season: string
  food_culture: string
  notable_animals: string[]
  visa_required_cn: boolean
  visa_note: string
  safety_level: 'low' | 'medium' | 'high'
  safety_note: string
}

export interface PropertyData {
  type: 'property'
  council: string
  primary_school: string
  secondary_school: string
  transport_score: string
  transport_note: string
  cbd_distance: string
  median_price_range: string
  nearby_amenities: string[]
}

export type PlaceData = CityData | PropertyData

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
  place_data: PlaceData | null
  tags: string[]
  created_at: string
}

export interface ParsedPin {
  name: string
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
  country?: string
  tags?: string[]
}
