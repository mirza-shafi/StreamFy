'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'

const STATUS_TABS = ['All', 'Live', 'Upcoming', 'Finished']

const SPORT_CATEGORIES = [
  { key: 'all', label: '🌐 All Sports' },
  { key: 'worldcup', label: '🏆 World Cup' },
  { key: 'football', label: '⚽ Football' },
  { key: 'cricket', label: '🏏 Cricket' },
]

function getSport(m) {
  const t = (m.tournament || '').toLowerCase()
  if (t.includes('world cup') || t.includes('fifa')) return 'worldcup'
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation')) return 'cricket'
  return 'football'
}

const btnCls = (active) =>
  `px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
    active ? 'bg-[#e63946] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500'
  }`

function MatchesContent() {
  const searchParams = useSearchParams()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('All')
  const [sportTab, setSportTab] = useState(searchParams.get('sport') || 'all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('matches').select('*').order('match_time', { ascending: true })
      .then(({ data }) => { setMatches(data || []); setLoading(false) })
  }, [])

  const filtered = matches.filter((m) => {
    const matchStatus = statusTab === 'All' || m.status?.toLowerCase() === statusTab.toLowerCase()
    const matchSport = sportTab === 'all' || getSport(m) === sportTab
    const matchSearch = !search || [m.team1, m.team2, m.tournament].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
    return matchStatus && matchSport && matchSearch
  })

  const counts = {}
  for (const cat of SPORT_CATEGORIES) {
    counts[cat.key] = cat.key === 'all' ? matches.length : matches.filter(m => getSport(m) === cat.key).length
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">All Matches</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {SPORT_CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setSportTab(cat.key)} className={btnCls(sportTab === cat.key)}>
            {cat.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${sportTab === cat.key ? 'bg-red-700' : 'bg-[#2a2a2a]'}`}>
              {counts[cat.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search team or tournament..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e63946] transition-colors placeholder:text-gray-600"
        />
        <div className="flex gap-2">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setStatusTab(t)} className={btnCls(statusTab === t)}>
              {t === 'Live'
                ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#e63946] live-dot" />{t}</span>
                : t}
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
          {filtered.map(m => <MatchCard key={m.id} match={m} />)}
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

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-40 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  )
}
