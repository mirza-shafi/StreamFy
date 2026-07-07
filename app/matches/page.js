'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isMatchExpired } from '@/lib/matchHelpers'

const STATUS_TABS = ['All', 'Live', 'Upcoming', 'Finished']

const SPORT_CATEGORIES = [
  { key: 'all', label: '🌐 All Sports' },
  { key: 'worldcup', label: '🏆 World Cup' },
  { key: 'football', label: '⚽ Football' },
  { key: 'cricket', label: '🏏 Cricket' },
]

function getSport(m) {
  const t = (m.tournament || '').toLowerCase()
  // Cricket World Cups must be checked BEFORE generic 'world cup'
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation') || t.includes('test')) return 'cricket'
  // FIFA / football World Cup
  if (t.includes('fifa') || (t.includes('world cup') && !t.includes('cricket'))) return 'worldcup'
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
    // Start of today in Bangladesh time (UTC+6) — correct midnight for BST users
    const nowBST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
    const todayStartBST = new Date(nowBST)
    todayStartBST.setHours(0, 0, 0, 0)
    const todayISO = new Date(todayStartBST.getTime() - 6 * 60 * 60 * 1000).toISOString()

    if (statusTab === 'Finished') {
      // "Finished" tab: show old finished matches (user explicitly wants these)
      supabase
        .from('matches')
        .select('*')
        .eq('status', 'finished')
        .order('match_time', { ascending: false })
        .limit(50)
        .then(({ data }) => { setMatches(data || []); setLoading(false) })
    } else {
      // Default: only today & future, no finished matches
      supabase
        .from('matches')
        .select('*')
        .neq('status', 'finished')          // exclude finished
        .gte('match_time', todayISO)        // today onwards only
        .order('match_time', { ascending: true })
        .then(({ data }) => {
          const activeMatches = (data || []).filter(m => {
            if (m.status === 'live' && isMatchExpired(m)) return false
            return true
          })
          setMatches(activeMatches)
          setLoading(false)
        })
    }
  }, [statusTab]) // re-fetch when tab changes

  const filtered = matches.filter((m) => {
    const matchStatus =
      statusTab === 'All' || statusTab === 'Finished' ||
      m.status?.toLowerCase() === statusTab.toLowerCase()
    const sport = getSport(m)
    const matchSport =
      sportTab === 'all' ||
      sport === sportTab ||
      // Football tab also includes World Cup (FIFA WC is football)
      (sportTab === 'football' && sport === 'worldcup')
    const matchSearch = !search || [m.team1, m.team2, m.tournament].some(
      (v) => v?.toLowerCase().includes(search.toLowerCase())
    )
    return matchStatus && matchSport && matchSearch
  })

  // Counts always computed from all fetched matches (not post-filtered), so tabs show real totals
  const counts = {}
  for (const cat of SPORT_CATEGORIES) {
    if (cat.key === 'all') {
      counts[cat.key] = matches.length
    } else if (cat.key === 'football') {
      // Football includes both plain football AND World Cup (World Cup IS football)
      counts[cat.key] = matches.filter((m) => getSport(m) === 'football' || getSport(m) === 'worldcup').length
    } else {
      counts[cat.key] = matches.filter((m) => getSport(m) === cat.key).length
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="text-2xl font-bold text-white">
          {statusTab === 'Finished' ? '🕐 Past Matches' : '📅 Matches'}
        </h1>
        {statusTab !== 'Finished' && (
          <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 text-xs px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

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
