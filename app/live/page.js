'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'

export default function LivePage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('*').eq('status', 'live').order('created_at', { ascending: false })
    setMatches(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()
    const interval = setInterval(fetchMatches, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-3 h-3 rounded-full bg-[#e63946] live-dot" />
        <h1 className="text-2xl font-bold text-white">Live Matches</h1>
        {!loading && (
          <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
            {matches.length} LIVE
          </span>
        )}
        <span className="text-xs text-gray-600 ml-auto">Auto-refreshes every 30s</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-lg font-medium">No live matches right now</p>
          <p className="text-sm mt-1">This page refreshes automatically when matches go live.</p>
        </div>
      )}
    </div>
  )
}
