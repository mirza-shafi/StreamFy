import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import ChannelCard from '@/components/ChannelCard'
import Link from 'next/link'

export const metadata = {
  metadataBase: new URL('https://streamfy.mirzashafi.com'),
  title: 'StreamFy - Live Sports Streaming',
  description: 'Watch live FIFA World Cup, cricket, and sports matches on StreamFy.',
}

export const revalidate = 60

function getSport(m) {
  const t = (m.tournament || '').toLowerCase()
  if (t.includes('world cup') || t.includes('fifa')) return 'worldcup'
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation')) return 'cricket'
  return 'football'
}

async function getData() {
  const [{ data: liveMatches }, { data: upcomingMatches }, { data: channels }] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'live').order('match_time'),
    supabase.from('matches').select('*').eq('status', 'upcoming').order('match_time').limit(12),
    supabase.from('channels').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
  ])
  return { liveMatches: liveMatches || [], upcomingMatches: upcomingMatches || [], channels: channels || [] }
}

function Section({ title, badge, matches, viewAllHref, viewAllLabel }) {
  if (!matches.length) return null
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {badge && <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">{badge}</span>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-[#e63946] hover:text-red-400 transition-colors">{viewAllLabel || 'View all →'}</Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const { liveMatches, upcomingMatches, channels } = await getData()

  const liveWC = liveMatches.filter(m => getSport(m) === 'worldcup')
  const liveCricket = liveMatches.filter(m => getSport(m) === 'cricket')
  const liveFootball = liveMatches.filter(m => getSport(m) === 'football' && getSport(m) !== 'worldcup')
  const otherLive = liveMatches.filter(m => !['worldcup','cricket','football'].includes(getSport(m)))

  const upWC = upcomingMatches.filter(m => getSport(m) === 'worldcup').slice(0, 6)
  const upCricket = upcomingMatches.filter(m => getSport(m) === 'cricket').slice(0, 3)
  const upFootball = upcomingMatches.filter(m => getSport(m) === 'football').slice(0, 3)

  const hasContent = liveMatches.length > 0 || upcomingMatches.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-12 mb-10">
        <span className="inline-flex items-center gap-2 bg-red-900/30 text-[#e63946] text-xs font-bold px-4 py-2 rounded-full border border-red-800/50 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#e63946] live-dot" />
          LIVE NOW
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
          Watch Sports <span className="text-[#e63946]">Live</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          FIFA World Cup 2026, Cricket World Cup, and live sports streaming.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/matches?sport=worldcup" className="px-6 py-3 bg-[#e63946] text-white rounded-xl font-semibold hover:bg-red-500 transition-colors">
            🏆 World Cup
          </Link>
          <Link href="/matches?sport=cricket" className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#3a3a3a] transition-colors">
            🏏 Cricket
          </Link>
          <Link href="/matches" className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#3a3a3a] transition-colors">
            ⚽ All Matches
          </Link>
        </div>
      </section>

      {/* Live sections */}
      {liveWC.length > 0 && (
        <Section title="🏆 World Cup — Live" badge={`${liveWC.length} LIVE`} matches={liveWC} viewAllHref="/matches?sport=worldcup" />
      )}
      {liveCricket.length > 0 && (
        <Section title="🏏 Cricket — Live" badge={`${liveCricket.length} LIVE`} matches={liveCricket} viewAllHref="/matches?sport=cricket" />
      )}
      {liveFootball.length > 0 && (
        <Section title="⚽ Football — Live" badge={`${liveFootball.length} LIVE`} matches={liveFootball} viewAllHref="/matches?sport=football" />
      )}
      {otherLive.length > 0 && (
        <Section title="🔴 Live Now" matches={otherLive} viewAllHref="/live" />
      )}

      {/* Upcoming sections */}
      {upWC.length > 0 && (
        <Section title="🏆 FIFA World Cup 2026" matches={upWC} viewAllHref="/matches?sport=worldcup" viewAllLabel="All WC matches →" />
      )}
      {upCricket.length > 0 && (
        <Section title="🏏 Upcoming Cricket" matches={upCricket} viewAllHref="/matches?sport=cricket" />
      )}
      {upFootball.length > 0 && (
        <Section title="⚽ Upcoming Football" matches={upFootball} viewAllHref="/matches?sport=football" />
      )}

      {/* Channels */}
      {channels.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">📺 TV Channels</h2>
            <Link href="/channels" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {channels.map(c => <ChannelCard key={c.id} channel={c} />)}
          </div>
        </section>
      )}

      {!hasContent && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium">No matches yet</p>
          <p className="text-sm mt-1">Go to <Link href="/admin" className="text-[#e63946]">Admin</Link> and click "Sync Cricket & Football"</p>
        </div>
      )}
    </div>
  )
}
