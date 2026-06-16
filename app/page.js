import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import ChannelCard from '@/components/ChannelCard'
import Link from 'next/link'

export const metadata = {
  title: 'StreamFy - Live Sports Streaming',
  description: 'Watch live sports matches, football, cricket, and more on StreamFy.',
}

export const revalidate = 30

async function getData() {
  const [{ data: liveMatches }, { data: upcomingMatches }, { data: channels }] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'live').order('created_at', { ascending: false }),
    supabase.from('matches').select('*').eq('status', 'upcoming').order('match_time', { ascending: true }).limit(6),
    supabase.from('channels').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
  ])
  return { liveMatches: liveMatches || [], upcomingMatches: upcomingMatches || [], channels: channels || [] }
}

export default async function HomePage() {
  const { liveMatches, upcomingMatches, channels } = await getData()

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
          Stream live matches, football, cricket, and TV channels — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/live" className="px-6 py-3 bg-[#e63946] text-white rounded-xl font-semibold hover:bg-red-500 transition-colors">
            Watch Live
          </Link>
          <Link href="/matches" className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#3a3a3a] transition-colors">
            All Matches
          </Link>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-3 h-3 rounded-full bg-[#e63946] live-dot" />
            <h2 className="text-xl font-bold text-white">Live Now</h2>
            <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
              {liveMatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Upcoming Matches</h2>
            <Link href="/matches" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* Channels */}
      {channels.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">TV Channels</h2>
            <Link href="/channels" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {channels.map((c) => <ChannelCard key={c.id} channel={c} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {liveMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium">No matches scheduled</p>
          <p className="text-sm mt-1">Check back later for live streams.</p>
        </div>
      )}
    </div>
  )
}
