import { checkStream } from './streamChecker'
import { IPTV_SOURCES, parseM3U, findBestMatch } from './streamSources'

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok ? res : null
  } catch { clearTimeout(t); return null }
}

async function searchIPTVJson(name) {
  try {
    const res = await fetchWithTimeout('https://iptv-org.github.io/api/streams.json')
    if (!res) return null
    const data = await res.json()
    const match = data.find(s =>
      s.channel?.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(s.channel?.toLowerCase())
    )
    if (match?.url) {
      const check = await checkStream(match.url)
      return check.alive ? match.url : null
    }
  } catch { return null }
  return null
}

async function searchM3UPlaylists(name) {
  const playlists = IPTV_SOURCES.filter(u => u.includes('.m3u'))
  for (const src of playlists) {
    try {
      const res = await fetchWithTimeout(src)
      if (!res) continue
      const text = await res.text()
      const channels = parseM3U(text)
      const match = findBestMatch(name, channels)
      if (match) {
        const check = await checkStream(match.url)
        if (check.alive) return match.url
      }
    } catch { continue }
  }
  return null
}

async function tryBackupUrls(backupUrls) {
  for (const url of backupUrls.filter(Boolean)) {
    const check = await checkStream(url)
    if (check.alive) return url
  }
  return null
}

export async function findStreamForMatch(team1, team2, tournament, backupUrls = []) {
  // Strategy 1: try existing backup URLs
  const fromBackup = await tryBackupUrls(backupUrls)
  if (fromBackup) return fromBackup

  // Strategy 2: IPTV JSON by tournament name
  if (tournament) {
    const fromJson = await searchIPTVJson(tournament)
    if (fromJson) return fromJson
  }

  // Strategy 3: IPTV JSON by team names
  const fromTeam = await searchIPTVJson(`${team1} ${team2}`)
  if (fromTeam) return fromTeam

  return null
}

export async function findStreamForChannel(channelName, backupUrls = []) {
  // Strategy 1: try existing backup URLs
  const fromBackup = await tryBackupUrls(backupUrls)
  if (fromBackup) return fromBackup

  // Strategy 2: IPTV JSON
  const fromJson = await searchIPTVJson(channelName)
  if (fromJson) return fromJson

  // Strategy 3: M3U playlists
  const fromM3U = await searchM3UPlaylists(channelName)
  if (fromM3U) return fromM3U

  return null
}
