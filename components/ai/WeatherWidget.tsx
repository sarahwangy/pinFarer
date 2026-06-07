'use client'
import { useEffect, useState } from 'react'

// 当前天气的数据结构（与 API route 返回保持一致）
interface CurrentWeather {
  temp: number
  feels_like: number
  humidity: number
  wind: number
  desc: string
  icon: string
  city: string
}

// 每天预报的数据结构
interface ForecastDay {
  date: string
  dayName: string
  icon: string
  min: number
  max: number
}

interface WeatherData {
  current: CurrentWeather
  forecast: ForecastDay[]
}

interface Props {
  destination: string
}

// 根据 icon code 生成 OpenWeatherMap 图标 URL
function iconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

// 加载中的骨架屏占位
function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-4 mt-0">
      <div className="bg-white rounded-2xl border border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-5 py-4 animate-pulse">
        <div className="h-3 w-32 bg-black/[0.08] rounded mb-4" />
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-black/[0.08] rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-8 w-20 bg-black/[0.08] rounded" />
            <div className="h-3 w-28 bg-black/[0.06] rounded" />
          </div>
          <div className="flex gap-6 ml-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-3 w-6 bg-black/[0.06] rounded" />
                <div className="w-8 h-8 bg-black/[0.08] rounded-full" />
                <div className="h-3 w-10 bg-black/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WeatherWidget({ destination }: Props) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)

    fetch(`/api/weather?city=${encodeURIComponent(destination)}`)
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((json: WeatherData | { error: string } | null) => {
        if (json && 'current' in json) {
          setData(json)
        }
      })
      .catch(() => {
        // 静默处理：天气获取失败时不显示组件
      })
      .finally(() => setLoading(false))
  }, [destination])

  if (loading) return <Skeleton />
  if (!data) return null // 出错或找不到城市时不显示

  const { current, forecast } = data

  return (
    <div className="max-w-3xl mx-auto px-5 py-4 mt-0">
      <div className="bg-white rounded-2xl border border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-5 py-4">

        {/* 标题行 */}
        <p className="text-[11px] font-semibold text-[var(--muted)] mb-3 tracking-wide">
          📍 {current.city} · 当地天气
        </p>

        {/* 主内容：当前天气 + 预报横排 */}
        <div className="flex items-center gap-5 flex-wrap">

          {/* 当前天气 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src={iconUrl(current.icon)}
              alt={current.desc}
              width={56}
              height={56}
              className="w-14 h-14"
            />
            <div>
              <div className="text-[32px] font-bold text-[var(--ink)] leading-none">
                {current.temp}°
              </div>
              <div className="text-[12px] text-[var(--muted)] mt-0.5 capitalize">
                {current.desc}
              </div>
              <div className="flex gap-3 mt-1 text-[11px] text-[var(--muted)]">
                <span>体感 {current.feels_like}°</span>
                <span>湿度 {current.humidity}%</span>
                <span>风速 {current.wind} m/s</span>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="w-px h-14 bg-black/[0.07] flex-shrink-0 hidden sm:block" />

          {/* 5 天预报 — 横向滚动 */}
          <div className="flex gap-3 overflow-x-auto flex-1 min-w-0 pb-0.5">
            {forecast.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-0.5 flex-shrink-0
                  px-2.5 py-2 rounded-xl bg-[var(--sand)] min-w-[52px]"
              >
                <span className="text-[10px] font-semibold text-[var(--muted)]">
                  {day.dayName}
                </span>
                <img
                  src={iconUrl(day.icon)}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-[11px] font-semibold text-[var(--ink)]">
                  {day.max}°
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                  {day.min}°
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
