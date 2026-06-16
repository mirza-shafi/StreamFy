import Link from 'next/link'

export default function MatchCard({ match }) {
  const { id, team1, team2, team1_flag, team2_flag, tournament, match_time, status } = match

  const isLive = status === 'live'
  const isFinished = status === 'finished'

  const formattedTime = match_time
    ? new Date(match_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'TBA'

  return (
    <Link href={`/matches/${id}`}
      className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#e63946] hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200 group">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        {isLive ? (
          <span className="flex items-center gap-1.5 bg-red-900/30 text-[#e63946] text-xs font-bold px-2.5 py-1 rounded-full border border-red-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e63946] live-dot" />
            LIVE
          </span>
        ) : (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isFinished
              ? 'bg-gray-800 text-gray-400 border border-gray-700'
              : 'bg-gray-800/50 text-gray-300 border border-gray-700'
          }`}>
            {status?.toUpperCase()}
          </span>
        )}
        {tournament && <span className="text-xs text-gray-500 truncate ml-2">{tournament}</span>}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 my-3">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-2xl">{team1_flag || '🏆'}</span>
          <span className="text-sm font-semibold text-white truncate w-full text-center">{team1}</span>
        </div>
        <span className="text-gray-500 font-bold text-sm shrink-0">VS</span>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-2xl">{team2_flag || '🏆'}</span>
          <span className="text-sm font-semibold text-white truncate w-full text-center">{team2}</span>
        </div>
      </div>

      {/* Time & button */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
        <span className="text-xs text-gray-500">{formattedTime}</span>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
          isLive
            ? 'bg-[#e63946] text-white group-hover:bg-red-500'
            : 'bg-[#2a2a2a] text-gray-300 group-hover:bg-[#e63946] group-hover:text-white'
        }`}>
          {isLive ? '▶ Watch Live' : 'Watch Now'}
        </span>
      </div>
    </Link>
  )
}
