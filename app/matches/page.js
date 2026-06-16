'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'

const TABS = ['All', 'Live', 'Upcoming', 'Finished']

export default function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('matches').select('*').order('match_time', { ascending: false })
      .then(({ data }) => { setMatches(data || []); setLoading(false) })
  }, [])

  const filtered = matches.filter((m) => {
    const matchTab = tab === 'All' || m.status?.toLowerCase() === tab.toLowerCase()
    const matchSearch = !search || [m.team1, m.team2, m.tournament].some(
      (v) => v?.toLowerCase().includes(search.toLowerCase())
    )
    return matchTab && matchSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">All Matches</h1>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text" placeholder="Search team or tournament..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e63946] transition-colors placeholder:text-gray-600"
        />
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t ? 'bg-[#e63946] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium">No matches found</p>
          <p className="text-sm mt-1">Try a different filter or search term.</p>
        </div>
      )}
    </div>
  )
}
