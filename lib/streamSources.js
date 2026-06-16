export const IPTV_SOURCES = [
  'https://iptv-org.github.io/api/streams.json',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/bd.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/pk.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/gb.m3u',
]

export function parseM3U(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  const channels = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const namMatch = lines[i].match(/,(.+)$/)
      const logoMatch = lines[i].match(/tvg-logo="([^"]*)"/)
      const groupMatch = lines[i].match(/group-title="([^"]*)"/)
      const url = lines[i + 1]
      if (url && !url.startsWith('#')) {
        channels.push({
          name: namMatch ? namMatch[1].trim() : '',
          url,
          logo: logoMatch ? logoMatch[1] : '',
          group: groupMatch ? groupMatch[1] : '',
        })
      }
    }
  }
  return channels
}

export function findBestMatch(searchName, channelList) {
  const search = searchName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const words = search.split(/\s+/).filter(Boolean)

  let best = null
  let bestScore = 0

  for (const ch of channelList) {
    const name = ch.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    let score = 0
    for (const word of words) {
      if (name.includes(word)) score += word.length
    }
    if (score > bestScore) { bestScore = score; best = ch }
  }

  return bestScore > 2 ? best : null
}
