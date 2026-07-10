import { supabase } from '@/lib/supabase'
import LiveMatchPlayer from '@/components/LiveMatchPlayer'
import MatchCard from '@/components/MatchCard'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }) {
  const { data } = await supabase.from('matches').select('team1,team2,tournament').eq('id', params.id).single()
  if (!data) return { title: 'Match Not Found' }
  return {
    title: `${data.team1} vs ${data.team2} - ${data.tournament || 'StreamFy'}`,
    description: `Watch ${data.team1} vs ${data.team2} live on StreamFy`,
  }
}

export const dynamic = 'force-dynamic'

import { getTodayISO } from '@/lib/matchHelpers'

export default async function WatchMatchPage({ params }) {
  const recentISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: match }, { data: related }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', params.id).single(),
    supabase
      .from('matches')
      .select('*')
      .neq('id', params.id)
      .in('status', ['live', 'upcoming'])
      .gte('match_time', recentISO)   // allow matches from the last 24 hours
      .order('match_time', { ascending: true })
      .limit(6),
  ])

  if (!match) notFound()

  // Bangladesh Standard Time (UTC+6), 12-hour format
  const formattedTime = match.match_time
    ? new Date(match.match_time).toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        dateStyle: 'full',
        timeStyle: 'short',
        hour12: true,
      })
    : 'TBA'

  const isLive = match.status === 'live'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Main content ── */}
        <div className="xl:col-span-2">
          {isLive ? (
            /* Live match → channel chooser player */
            <LiveMatchPlayer match={match} />
          ) : (
            /* Upcoming / finished → simple upcoming notice */
            <div className="relative w-full rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col items-center justify-center gap-4 py-20">
              <div className="text-5xl">⏳</div>
              <p className="text-white font-semibold text-lg">Match not started yet</p>
              <p className="text-gray-400 text-sm">{formattedTime}</p>
            </div>
          )}

          {/* Match info panel */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mt-4">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {isLive ? (
                <span className="flex items-center gap-1.5 bg-red-900/30 text-[#e63946] text-xs font-bold px-2.5 py-1 rounded-full border border-red-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e63946] live-dot" />
                  LIVE
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                  {match.status?.toUpperCase()}
                </span>
              )}
              {match.tournament && (
                <span className="text-gray-400 text-sm">{match.tournament}</span>
              )}
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-5xl mb-2">{match.team1_flag || '🏆'}</div>
                <div className="font-bold text-xl text-white">{match.team1}</div>
              </div>
              <div className="text-gray-500 font-black text-3xl">VS</div>
              <div className="text-center">
                <div className="text-5xl mb-2">{match.team2_flag || '🏆'}</div>
                <div className="font-bold text-xl text-white">{match.team2}</div>
              </div>
            </div>

            <div className="border-t border-[#2a2a2a] pt-4 text-sm text-gray-400">
              🕐 {formattedTime} <span className="text-gray-600 ml-1">(Bangladesh Time)</span>
            </div>
          </div>
        </div>

        {/* ── Sidebar: Related matches ── */}
        {related?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Other Matches</h2>
            <div className="flex flex-col gap-3">
              {related.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: `${match.team1} vs ${match.team2}`,
            description: `Live sports stream: ${match.team1} vs ${match.team2} ${match.tournament ? `in ${match.tournament}` : ''}`,
            startDate: match.match_time,
            eventStatus: isLive ? 'https://schema.org/EventInProgress' : 'https://schema.org/EventScheduled',
            homeTeam: {
              '@type': 'SportsTeam',
              name: match.team1,
            },
            awayTeam: {
              '@type': 'SportsTeam',
              name: match.team2,
            },
            location: {
              '@type': 'VirtualLocation',
              url: `https://streamfy.mirzashafi.com/matches/${match.id}`,
            },
          }),
        }}
      />
    </div>
  )
}
