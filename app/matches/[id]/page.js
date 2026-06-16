import { supabase } from '@/lib/supabase'
import VideoPlayer from '@/components/VideoPlayer'
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

export const revalidate = 30

export default async function WatchMatchPage({ params }) {
  const [{ data: match }, { data: related }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', params.id).single(),
    supabase.from('matches').select('*').neq('id', params.id).in('status', ['live', 'upcoming']).limit(3),
  ])

  if (!match) notFound()

  const formattedTime = match.match_time
    ? new Date(match.match_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
    : 'TBA'

  const isLive = match.status === 'live'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2">
          <VideoPlayer
            streamUrl={match.stream_url}
            streamUrl2={match.stream_url_2 || match.backup_stream_url}
            streamUrl3={match.stream_url_3}
            title={`${match.team1} vs ${match.team2}`}
          />

          {/* Match info */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mt-4">
            <div className="flex items-center gap-3 mb-4">
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
              {match.tournament && <span className="text-gray-400 text-sm">{match.tournament}</span>}
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{match.team1_flag || '🏆'}</div>
                <div className="font-bold text-lg text-white">{match.team1}</div>
              </div>
              <div className="text-gray-500 font-black text-2xl">VS</div>
              <div className="text-center">
                <div className="text-4xl mb-2">{match.team2_flag || '🏆'}</div>
                <div className="font-bold text-lg text-white">{match.team2}</div>
              </div>
            </div>

            <div className="border-t border-[#2a2a2a] pt-4 text-sm text-gray-400">
              🕐 {formattedTime}
            </div>
          </div>
        </div>

        {/* Sidebar - Related */}
        {related?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Other Matches</h2>
            <div className="flex flex-col gap-3">
              {related.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
