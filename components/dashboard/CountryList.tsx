import Link from 'next/link'

interface Props {
  topCountries: { country: string; count: number }[]
}

export default function CountryList({ topCountries }: Props) {
  if (topCountries.length === 0) {
    return <div className="text-[var(--muted)] text-sm">暂无数据</div>
  }

  const max = topCountries[0].count

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {topCountries.map(({ country, count }, i) => (
        <Link
          key={country}
          href={`/?country=${encodeURIComponent(country)}`}
          className="flex items-center gap-3 group"
        >
          <span className="text-[12px] font-bold text-[var(--muted)] w-5 text-right flex-shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[13px] mb-1">
              <span className="font-medium text-[var(--ink)] truncate group-hover:text-[var(--coral)] transition-colors">
                {country}
              </span>
              <span className="text-[var(--muted)] ml-2 flex-shrink-0">{count}</span>
            </div>
            <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--coral)] transition-all duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
