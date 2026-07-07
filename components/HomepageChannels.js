'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomepageChannels() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/m3u-channels')
      .then(r => r.json())
      .then(data => {
        setChannels((data.channels || []).slice(0, 12))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">📺 TV Channels</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-24 h-24 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    </section>
  )

  if (!channels.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">📺 TV Channels</h2>
        <Link href="/channels" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
          View all →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {channels.map((c) => (
          <Link
            key={c.id}
            href={`/channels/${c.id}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 w-24 hover:border-[#e63946] hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
              {c.logo_url ? (
                <Image src={c.logo_url} alt={c.name} width={48} height={48} className="object-contain" unoptimized />
              ) : (
                <span className="text-xl">📺</span>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-300 group-hover:text-white text-center leading-tight truncate w-full">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
