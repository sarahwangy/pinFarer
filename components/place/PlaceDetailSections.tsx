import type { PlaceData, CityData, PropertyData } from '@/types/pin'

interface Props {
  data: PlaceData
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-1.5">
        {icon} {label}
      </div>
      <div className="text-[14px] font-medium text-[var(--ink)]">{value}</div>
    </div>
  )
}

function TagChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="px-3 py-1 rounded-full text-[12px] font-semibold
          bg-[var(--coral)]/10 text-[var(--coral)] border border-[var(--coral)]/20">
          {item}
        </span>
      ))}
    </div>
  )
}

function CitySection({ data }: { data: CityData }) {
  const safetyColors = {
    low: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  const safetyLabels = { low: '低', medium: '中', high: '高' }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-[18px] font-semibold text-[var(--ink)]">🌆 城市概况</h2>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon="👥" label="人口" value={data.population} />
        <InfoCard icon="🗣" label="语言" value={`${data.language}${data.language_is_english ? ' (English)' : ''}`} />
        <InfoCard icon="💰" label="货币" value={data.currency} />
        <InfoCard icon="🕐" label="时区" value={data.timezone} />
        <InfoCard icon="🌤" label="气候" value={data.climate} />
        <InfoCard icon="🌸" label="最佳旅行季节" value={data.best_season} />
      </div>

      {/* Food culture */}
      <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
          🍜 饮食文化
        </div>
        <p className="text-[13px] text-[var(--ink)] leading-relaxed">{data.food_culture}</p>
      </div>

      {/* Animals */}
      {data.notable_animals.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-3">
            🦘 代表性动物
          </div>
          <TagChips items={data.notable_animals} />
        </div>
      )}

      {/* Visa */}
      <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
          ✈️ 签证（中国护照）
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border
            ${data.visa_required_cn
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
            {data.visa_required_cn ? '需要签证' : '免签 / 电子签'}
          </span>
        </div>
        <p className="text-[13px] text-[var(--muted)]">{data.visa_note}</p>
      </div>

      {/* Safety */}
      <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
          🛡 安全指数
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border
            ${safetyColors[data.safety_level]}`}>
            {safetyLabels[data.safety_level]}
          </span>
        </div>
        <p className="text-[13px] text-[var(--muted)]">{data.safety_note}</p>
      </div>
    </div>
  )
}

function PropertySection({ data }: { data: PropertyData }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-[18px] font-semibold text-[var(--ink)]">🏠 房产信息</h2>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon="🏛" label="所属 Council" value={data.council} />
        <InfoCard icon="🚆" label="交通评分" value={data.transport_score} />
        <InfoCard icon="🏫" label="附近小学" value={data.primary_school} />
        <InfoCard icon="🎓" label="附近中学" value={data.secondary_school} />
        <InfoCard icon="📍" label="到 CBD" value={data.cbd_distance} />
        <InfoCard icon="💵" label="中位房价区间" value={data.median_price_range} />
      </div>

      {/* Transport note */}
      <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
          🚌 公共交通
        </div>
        <p className="text-[13px] text-[var(--ink)] leading-relaxed">{data.transport_note}</p>
      </div>

      {/* Nearby amenities */}
      {data.nearby_amenities.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] mb-3">
            🛒 周边设施
          </div>
          <TagChips items={data.nearby_amenities} />
        </div>
      )}
    </div>
  )
}

export default function PlaceDetailSections({ data }: Props) {
  if (data.type === 'city') return <CitySection data={data} />
  return <PropertySection data={data} />
}
