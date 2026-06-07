import { NextResponse } from 'next/server'

// 从 OpenWeatherMap 当前天气响应中提取我们需要的字段
interface CurrentWeatherResponse {
  temp: number
  feels_like: number
  humidity: number
  wind: number
  desc: string
  icon: string
  city: string
}

// 5 天预报中，每天的汇总数据
interface ForecastDay {
  date: string
  dayName: string
  icon: string
  min: number
  max: number
}

// 中文星期名称映射
const DAY_NAMES_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json({ error: 'city required' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'api key not configured' }, { status: 500 })
  }

  const baseParams = `q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_cn`

  // 同时请求当前天气和 5 天预报
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?${baseParams}`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${baseParams}&cnt=40`),
  ])

  // 城市找不到时，OpenWeatherMap 返回 404
  if (currentRes.status === 404 || forecastRes.status === 404) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (!currentRes.ok || !forecastRes.ok) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentData: Record<string, any> = await currentRes.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forecastData: Record<string, any> = await forecastRes.json()

  // 只提取前端需要的字段，不把整个 API 响应暴露出去
  const current: CurrentWeatherResponse = {
    temp: Math.round(currentData.main.temp),
    feels_like: Math.round(currentData.main.feels_like),
    humidity: currentData.main.humidity,
    wind: currentData.wind.speed,
    desc: currentData.weather[0].description,
    icon: currentData.weather[0].icon,
    city: currentData.name,
  }

  // 从 list[] 中每天选一条记录（优先选 12:00:00，没有则选当天第一条）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDay: Record<string, any[]> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of forecastData.list as any[]) {
    const date = item.dt_txt.split(' ')[0] // "2024-01-15"
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(item)
  }

  const forecast: ForecastDay[] = Object.entries(byDay)
    .slice(0, 5) // 最多 5 天
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([date, items]: [string, any[]]) => {
      // 优先找正午 12:00 那条数据
      const noon = items.find((it) => it.dt_txt.includes('12:00:00'))
      const chosen = noon ?? items[0]

      const dayOfWeek = new Date(date + 'T12:00:00').getDay()

      return {
        date,
        dayName: DAY_NAMES_ZH[dayOfWeek],
        icon: chosen.weather[0].icon,
        min: Math.round(Math.min(...items.map((it) => it.main.temp_min))),
        max: Math.round(Math.max(...items.map((it) => it.main.temp_max))),
      }
    })

  return NextResponse.json({ current, forecast })
}
