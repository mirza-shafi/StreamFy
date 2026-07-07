import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import ChannelCard from '@/components/ChannelCard'
import Link from 'next/link'

export const metadata = {
  metadataBase: new URL('https://streamfy.mirzashafi.com'),
  title: 'StreamFy - Live Sports Streaming',
  description: 'Watch live FIFA World Cup, cricket, and sports matches on StreamFy.',
}

// Revalidate every 60 seconds so "today" always stays fresh
export const revalidate = 60

function getSport(m) {
  const t = (m.tournament || '').toLowerCase()
  if (t.includes('world cup') || t.includes('fifa')) return 'worldcup'
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation')) return 'cricket'
  return 'football'
}

/** Returns true when a match's match_time falls on today (server local date) */
function isToday(matchTime) {
  if (!matchTime) return false
  const match = new Date(matchTime)
  const now = new Date()
  return (
    match.getFullYear() === now.getFullYear() &&
    match.getMonth() === now.getMonth() &&
    match.getDate() === now.getDate()
  )
}

/** Format today's date in Bangladesh timezone, e.g. "Tuesday, July 8, 2026" */
function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function getData() {
  // Start of today in ISO format — used to exclude yesterday & older from DB
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [{ data: liveMatches }, { data: allUpcoming }, { data: channels }] = await Promise.all([
    // Live matches — always show regardless of date
    supabase.from('matches').select('*').eq('status', 'live').order('match_time'),
    // Upcoming: only from today onwards, never finished
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .gte('match_time', todayISO)   // >= today 00:00:00 — no yesterday, no old
      .order('match_time')
      .limit(50),
    supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const live = liveMatches || []
  const upcoming = allUpcoming || []

  // Today's matches: live OR upcoming with match_time = today
  const todayMatches = [
    ...live,
    ...upcoming.filter((m) => isToday(m.match_time)),
  ]

  // Future upcoming (tomorrow+), max 12
  const upcomingMatches = upcoming
    .filter((m) => !isToday(m.match_time))
    .slice(0, 12)

  return {
    liveMatches: live,
    todayMatches,
    upcomingMatches,
    channels: channels || [],
    todayLabel: formatTodayDate(),
  }
}

function Section({ title, badge, matches, viewAllHref, viewAllLabel, highlight }) {
  if (!matches.length) return null
  return (
    <section className={`mb-10 ${highlight ? 'relative' : ''}`}>
      {highlight && (
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-red-900/10 to-transparent pointer-events-none" />
      )}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {badge && (
            <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
              {badge}
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
            {viewAllLabel || 'View all →'}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const { liveMatches, todayMatches, upcomingMatches, channels, todayLabel } = await getData()

  const liveWC = liveMatches.filter((m) => getSport(m) === 'worldcup')
  const liveCricket = liveMatches.filter((m) => getSport(m) === 'cricket')
  const liveFootball = liveMatches.filter(
    (m) => getSport(m) === 'football' && getSport(m) !== 'worldcup'
  )
  const otherLive = liveMatches.filter(
    (m) => !['worldcup', 'cricket', 'football'].includes(getSport(m))
  )

  const upWC = upcomingMatches.filter((m) => getSport(m) === 'worldcup').slice(0, 6)
  const upCricket = upcomingMatches.filter((m) => getSport(m) === 'cricket').slice(0, 3)
  const upFootball = upcomingMatches.filter((m) => getSport(m) === 'football').slice(0, 3)

  const hasContent = liveMatches.length > 0 || todayMatches.length > 0 || upcomingMatches.length > 0

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
          <Link
            href="/matches?sport=worldcup"
            className="px-6 py-3 bg-[#e63946] text-white rounded-xl font-semibold hover:bg-red-500 transition-colors"
          >
            🏆 World Cup
          </Link>
          <Link
            href="/matches?sport=cricket"
            className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#3a3a3a] transition-colors"
          >
            🏏 Cricket
          </Link>
          <Link
            href="/matches"
            className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#3a3a3a] transition-colors"
          >
            ⚽ All Matches
          </Link>
        </div>
      </section>

      {/* ── TODAY'S MATCHES ── */}
      {todayMatches.length > 0 && (
        <section className="mb-10">
          {/* Section header with live date */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">📅 Today&apos;s Matches</h2>
              {/* Always-current date badge */}
              <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 text-xs px-3 py-1 rounded-full">
                {todayLabel}
              </span>
              {liveMatches.length > 0 && (
                <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e63946] live-dot" />
                  {liveMatches.length} LIVE
                </span>
              )}
            </div>
            <Link
              href="/matches"
              className="text-sm text-[#e63946] hover:text-red-400 transition-colors"
            >
              All matches →
            </Link>
          </div>

          {/* Today matches grid — live ones first */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ...todayMatches.filter((m) => m.status === 'live'),
              ...todayMatches.filter((m) => m.status !== 'live'),
            ].map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ── LIVE sections (sport-grouped, if not already shown above) ── */}
      {liveWC.length > 0 && (
        <Section
          title="🏆 World Cup — Live"
          badge={`${liveWC.length} LIVE`}
          matches={liveWC}
          viewAllHref="/matches?sport=worldcup"
        />
      )}
      {liveCricket.length > 0 && (
        <Section
          title="🏏 Cricket — Live"
          badge={`${liveCricket.length} LIVE`}
          matches={liveCricket}
          viewAllHref="/matches?sport=cricket"
        />
      )}
      {liveFootball.length > 0 && (
        <Section
          title="⚽ Football — Live"
          badge={`${liveFootball.length} LIVE`}
          matches={liveFootball}
          viewAllHref="/matches?sport=football"
        />
      )}
      {otherLive.length > 0 && (
        <Section title="🔴 Live Now" matches={otherLive} viewAllHref="/live" />
      )}

      {/* ── UPCOMING sections ── */}
      {upWC.length > 0 && (
        <Section
          title="🏆 FIFA World Cup 2026"
          matches={upWC}
          viewAllHref="/matches?sport=worldcup"
          viewAllLabel="All WC matches →"
        />
      )}
      {upCricket.length > 0 && (
        <Section
          title="🏏 Upcoming Cricket"
          matches={upCricket}
          viewAllHref="/matches?sport=cricket"
        />
      )}
      {upFootball.length > 0 && (
        <Section
          title="⚽ Upcoming Football"
          matches={upFootball}
          viewAllHref="/matches?sport=football"
        />
      )}

      {/* ── CHANNELS ── */}
      {channels.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">📺 TV Channels</h2>
            <Link href="/channels" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {channels.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium">No matches yet</p>
          <p className="text-sm mt-1">
            Go to{' '}
            <Link href="/admin" className="text-[#e63946]">
              Admin
            </Link>{' '}
            and click &quot;Sync Cricket &amp; Football&quot;
          </p>
        </div>
      )}
    </div>
  )
}
