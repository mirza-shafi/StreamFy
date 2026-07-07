/**
 * Checks if a match has exceeded its typical active duration.
 * - Cricket matches: Expire after 8 hours.
 * - Football/Other matches: Expire after 3 hours.
 */
export function isMatchExpired(match) {
  if (!match || !match.match_time || match.status === 'finished') return false
  
  const now = new Date()
  const matchTime = new Date(match.match_time)
  const diffHours = (now - matchTime) / (1000 * 60 * 60)
  
  const t = (match.tournament || '').toLowerCase()
  const isCricket = t.includes('cricket') || t.includes('icc') || t.includes('t20') ||
                    t.includes('tour of') || t.includes('tri nation') || t.includes('test')
  const threshold = isCricket ? 8 : 3
  
  return diffHours >= threshold
}

/**
 * Returns the ISO string of 00:00:00 AM today in Bangladesh Standard Time (BST).
 * Prevents timezone parsing bugs on Vercel servers.
 */
export function getTodayISO() {
  const now = new Date()
  const bstTime = new Date(now.getTime() + 6 * 60 * 60 * 1000)
  const year = bstTime.getUTCFullYear()
  const month = bstTime.getUTCMonth()
  const date = bstTime.getUTCDate()
  // Midnight UTC on the BST date
  const startOfTodayUTC = new Date(Date.UTC(year, month, date, 0, 0, 0, 0))
  // Midnight BST is 6 hours before midnight UTC
  return new Date(startOfTodayUTC.getTime() - 6 * 60 * 60 * 1000).toISOString()
}

