'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ChannelCard from '@/components/ChannelCard'

const CATEGORIES = ['All', 'Sports', 'News', 'Entertainment']

export default function ChannelsPage() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')

  useEffect(() => {
    supabase.from('channels').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setChannels(data || []); setLoading(false) })
  }, [])

  const filtered = cat === 'All' ? channels : channels.filter((c) => c.category === cat)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">TV Channels</h1>
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                cat === c ? 'bg-[#e63946] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((c) => <ChannelCard key={c.id} channel={c} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-lg font-medium">No channels in this category</p>
        </div>
      )}
    </div>
  )
}
