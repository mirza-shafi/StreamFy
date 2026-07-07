import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import ChannelCard from '@/components/ChannelCard'
import Link from 'next/link'

export const metadata = {
  metadataBase: new URL('https://streamfy.mirzashafi.com'),
  title: 'StreamFy - Live Sports Streaming',
  description: 'Watch live FIFA World Cup, cricket, and sports matches on StreamFy.',
}

import { isMatchExpired } from '@/lib/matchHelpers'

// Revalidate every 60 seconds so "today" always stays fresh
export const revalidate = 60

function getSport(m) {
  const t = (m.tournament || '').toLowerCase()
  // Cricket World Cups must be checked BEFORE generic 'world cup' so they don't fall into FIFA WC
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation') || t.includes('test')) return 'cricket'
  // FIFA / football World Cup
  if (t.includes('fifa') || (t.includes('world cup') && !t.includes('cricket'))) return 'worldcup'
  return 'football'
}

/** Returns true when a match's match_time falls on today in Bangladesh time (BST = UTC+6) */
function isToday(matchTime) {
  if (!matchTime) return false
  // Use BST (UTC+6) for comparison so midnight rollover is correct for Bangladesh
  const opts = { timeZone: 'Asia/Dhaka' }
  const matchDate = new Date(matchTime).toLocaleDateString('en-CA', opts)  // YYYY-MM-DD
  const todayDate = new Date().toLocaleDateString('en-CA', opts)
  return matchDate === todayDate
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
  // Start of today in Bangladesh time (UTC+6)
  // We calculate midnight BST then convert to ISO for Supabase
  const nowBST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  const todayStartBST = new Date(nowBST)
  todayStartBST.setHours(0, 0, 0, 0)
  // Offset from BST back to UTC: BST = UTC+6, so subtract 6 hours
  const todayISO = new Date(todayStartBST.getTime() - 6 * 60 * 60 * 1000).toISOString()

  const [{ data: liveMatches }, { data: allUpcoming }, { data: channels }] = await Promise.all([
    // Live matches — only from today onwards (skip stale 'live' rows from previous days)
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .gte('match_time', todayISO)   // >= today 00:00 BST — no yesterday
      .order('match_time'),
    // Upcoming: only from today onwards, never finished
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .gte('match_time', todayISO)   // >= today 00:00 BST — no old matches
      .order('match_time')
      .limit(50),
    supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // Filter out dynamically expired live matches (football > 4h, cricket > 8h)
  const live = (liveMatches || []).filter(m => !isMatchExpired(m))
  const upcoming = allUpcoming || []

  // Sort helper — ascending match_time
  const byTime = (a, b) => new Date(a.match_time) - new Date(b.match_time)

  // Today's matches: live + today's upcoming, sorted by time (live first within same time)
  const todayUpcoming = upcoming.filter((m) => isToday(m.match_time))
  const todayMatches = [
    ...live.sort(byTime),
    ...todayUpcoming.sort(byTime),
  ]

  // Future upcoming (tomorrow+)
  const futureUpcoming = upcoming.filter((m) => !isToday(m.match_time)).sort(byTime)

  // Sport buckets for upcoming sections
  const upWC = futureUpcoming.filter((m) => getSport(m) === 'worldcup').slice(0, 9)
  // Football section: plain football + World Cup (so it's never empty during WC season)
  const upFootball = futureUpcoming.filter(
    (m) => getSport(m) === 'football' || getSport(m) === 'worldcup'
  ).slice(0, 6)
  const upCricket  = futureUpcoming.filter((m) => getSport(m) === 'cricket').slice(0, 6)

  // Also today's per-sport for sections
  const todayWC       = todayMatches.filter((m) => getSport(m) === 'worldcup')
  // Football today: plain football + WC matches
  const todayFootball = todayMatches.filter(
    (m) => getSport(m) === 'football' || getSport(m) === 'worldcup'
  )
  const todayCricket  = todayMatches.filter((m) => getSport(m) === 'cricket')

  return {
    liveMatches: live,
    todayMatches,
    upWC,
    upFootball,
    upCricket,
    todayWC,
    todayFootball,
    todayCricket,
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
  const {
    liveMatches, todayMatches,
    upWC, upFootball, upCricket,
    todayWC, todayFootball, todayCricket,
    channels, todayLabel,
  } = await getData()

  const hasContent = todayMatches.length > 0 || upWC.length > 0 || upFootball.length > 0 || upCricket.length > 0

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

      {/* ── TODAY'S MATCHES (All Sports, time-sorted, live first) ── */}
      {todayMatches.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">📅 Today&apos;s Matches</h2>
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
            <Link href="/matches" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
              All matches →
            </Link>
          </div>
          {/* Live first, then upcoming — all sorted by match_time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ── FIFA WORLD CUP 2026 ── */}
      {(todayWC.length > 0 || upWC.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">🏆 FIFA World Cup 2026</h2>
              {todayWC.filter(m => m.status === 'live').length > 0 && (
                <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
                  {todayWC.filter(m => m.status === 'live').length} LIVE
                </span>
              )}
            </div>
            <Link href="/matches?sport=worldcup" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
              All WC matches →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Today's WC first, then upcoming WC — both already time-sorted */}
            {[...todayWC, ...upWC].map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTBALL ── */}
      {(todayFootball.length > 0 || upFootball.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">⚽ Football</h2>
              {todayFootball.filter(m => m.status === 'live').length > 0 && (
                <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
                  {todayFootball.filter(m => m.status === 'live').length} LIVE
                </span>
              )}
            </div>
            <Link href="/matches?sport=football" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
              All football →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...todayFootball, ...upFootball].map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ── CRICKET ── */}
      {(todayCricket.length > 0 || upCricket.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">🏏 Cricket</h2>
              {todayCricket.filter(m => m.status === 'live').length > 0 && (
                <span className="bg-red-900/30 text-[#e63946] text-xs font-bold px-2 py-0.5 rounded-full border border-red-800/50">
                  {todayCricket.filter(m => m.status === 'live').length} LIVE
                </span>
              )}
            </div>
            <Link href="/matches?sport=cricket" className="text-sm text-[#e63946] hover:text-red-400 transition-colors">
              All cricket →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...todayCricket, ...upCricket].map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
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
