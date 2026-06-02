import { Suspense } from 'react'
import MapPage from '@/components/MapPage'

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-[var(--map-bg)]" />}>
      <MapPage />
    </Suspense>
  )
}
