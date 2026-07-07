'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import ChannelCard from '@/components/ChannelCard'
import M3UChannelCard from '@/components/M3UChannelCard'

const CATEGORIES = ['All', 'Sports', 'News', 'Entertainment']

export default function ChannelsPage() {
  const [dbChannels, setDbChannels] = useState([])
  const [m3uChannels, setM3uChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [m3uLoading, setM3uLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  // Load Supabase channels
  useEffect(() => {
    supabase.from('channels').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setDbChannels(data || []); setLoading(false) })
  }, [])

  // Load M3U playlist channels
  useEffect(() => {
    fetch('/api/m3u-channels')
      .then((r) => r.json())
      .then(({ channels }) => { setM3uChannels(channels || []); setM3uLoading(false) })
      .catch(() => setM3uLoading(false))
  }, [])

  const allChannels = useMemo(() => {
    // Merge: Supabase channels first, then M3U channels (deduplicate by name)
    const dbNames = new Set(dbChannels.map((c) => c.name?.toLowerCase()))
    // Normalize M3U channels so they have .stream_url available
    const uniqueM3U = m3uChannels
      .filter((c) => !dbNames.has(c.name?.toLowerCase()))
      .filter((c) => {
        // On HTTPS sites, only show HTTPS streams (HTTP streams are blocked by browser)
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
          const url = c.stream_url || c.url || ''
          return url.startsWith('https://')
        }
        return true
      })
    return [...dbChannels, ...uniqueM3U]
  }, [dbChannels, m3uChannels])

  const filtered = useMemo(() => {
    let result = cat === 'All' ? allChannels : allChannels.filter((c) => c.category === cat)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.name?.toLowerCase().includes(q))
    }
    return result
  }, [allChannels, cat, search])

  const isFullyLoading = loading && m3uLoading

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">TV Channels</h1>
          {!isFullyLoading && (
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} channels
              {m3uLoading ? (
                <span className="ml-2 px-2 py-0.5 bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] rounded text-xs animate-pulse">
                  checking live channels...
                </span>
              ) : m3uChannels.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-800 rounded text-xs">
                  ✓ {m3uChannels.length} verified live
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#e63946] focus:outline-none transition-colors"
          />
          {/* Category filter */}
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  cat === c
                    ? 'bg-[#e63946] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton loading */}
      {isFullyLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((c) =>
            c.source === 'm3u' ? (
              <M3UChannelCard key={c.id} channel={c} />
            ) : (
              <ChannelCard key={c.id} channel={c} />
            )
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-lg font-medium">No channels found</p>
          {search && <p className="text-sm mt-2 text-gray-600">Try a different search term</p>}
        </div>
      )}
    </div>
  )
}
