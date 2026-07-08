import Link from 'next/link'

function getSportLabel(tournament) {
  const t = (tournament || '').toLowerCase()
  if (t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
      t.includes('tour of') || t.includes('tri nation') || t.includes('test')) return 'Cricket'
  if (t.includes('fifa') || (t.includes('world cup') && !t.includes('cricket'))) return 'World Cup'
  return 'Football'
}

export default function MatchCard({ match }) {
  const { id, team1, team2, team1_flag, team2_flag, tournament, match_time, status } = match

  const isLive = status === 'live'
  const isFinished = status === 'finished'
  const sportLabel = getSportLabel(tournament)

  const now = new Date()
  const matchDate = match_time ? new Date(match_time) : null

  const formattedTime = matchDate
    ? (() => {
        const diffMs = matchDate - now
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const timeStr = matchDate.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        if (diffDays === 0) return `Today ${timeStr}`
        if (diffDays === 1) return `Tomorrow ${timeStr}`
        if (diffDays === -0 || (diffMs < 0 && diffMs > -86400000)) return `Today ${timeStr}`
        return matchDate.toLocaleDateString('en-US', {
          timeZone: 'Asia/Dhaka',
          month: 'short',
          day: 'numeric',
        }) + ` ${timeStr}`
      })()
    : 'TBA'

  return (
    <Link href={`/matches/${id}`}
      className="block bg-[#141414] border border-[#252525] rounded-2xl overflow-hidden hover:border-[#e63946] hover:shadow-xl hover:shadow-red-900/20 transition-all duration-250 group">

      {/* Top bar: sport badge + status */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#3a3a3a] text-gray-300 bg-[#1e1e1e] tracking-wide uppercase">
          {sportLabel}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 bg-red-900/40 text-[#e63946] text-[10px] font-bold px-2.5 py-1 rounded-md border border-red-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e63946] live-dot" />
            LIVE
          </span>
        ) : (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase ${
            isFinished
              ? 'bg-gray-800 text-gray-500 border border-gray-700'
              : 'bg-[#1e1e1e] text-gray-300 border border-[#3a3a3a]'
          }`}>
            {status?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between px-5 py-4 gap-2">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-full bg-[#222] border-2 border-[#2e2e2e] flex items-center justify-center text-4xl shadow-inner">
            {team1_flag || '🏆'}
          </div>
          <span className="text-sm font-bold text-white text-center leading-tight truncate w-full px-1">{team1}</span>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[#e63946] font-black text-base">VS</span>
          <span className="text-[10px] text-gray-500 text-center whitespace-nowrap">{formattedTime}</span>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-full bg-[#222] border-2 border-[#2e2e2e] flex items-center justify-center text-4xl shadow-inner">
            {team2_flag || '🏆'}
          </div>
          <span className="text-sm font-bold text-white text-center leading-tight truncate w-full px-1">{team2}</span>
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-4 pb-4">
        <div className={`w-full text-center py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
          isLive
            ? 'bg-[#e63946] text-white group-hover:bg-red-500'
            : 'bg-[#1e1e1e] border border-[#2e2e2e] text-gray-300 group-hover:bg-[#e63946] group-hover:text-white group-hover:border-[#e63946]'
        }`}>
          {isLive ? '▶ Watch Live' : '⏱ View match'}
        </div>
      </div>
    </Link>
  )
}
