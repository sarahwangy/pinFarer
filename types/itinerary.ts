export interface Activity {
  time: string
  name: string
  desc: string
  color: 'coral' | 'mint' | 'amber' | 'lavender'
}

export interface DayPlan {
  day: string
  title: string
  tag: string
  activities: Activity[]
}

export interface Itinerary {
  title: string
  days: DayPlan[]
  pinCount: number
  style: string
  totalDays: number
  quote?: string
  quoteAuthor?: string
}
