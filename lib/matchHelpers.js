/**
 * Checks if a match has exceeded its typical active duration.
 * - Cricket matches: Expire after 8 hours.
 * - Football/Other matches: Expire after 4 hours.
 */
export function isMatchExpired(match) {
  if (!match || !match.match_time || match.status === 'finished') return false
  
  const now = new Date()
  const matchTime = new Date(match.match_time)
  const diffHours = (now - matchTime) / (1000 * 60 * 60)
  
  const t = (match.tournament || '').toLowerCase()
  const isCricket = t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
                    t.includes('tour of') || t.includes('tri nation') || t.includes('test')
  const threshold = isCricket ? 8 : 4
  
  return diffHours >= threshold
}
