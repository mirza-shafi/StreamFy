import { NextResponse } from 'next/server'

const M3U_URL =
  'https://raw.githubusercontent.com/sanjoykb/-KB-TV-Playlist/refs/heads/main/Github%20Auto%20Update%20Channel.m3u'

function parseM3U(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const channels = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const nameMatch = lines[i].match(/,(.+)$/)
      const logoMatch = lines[i].match(/tvg-logo="([^"]*)"/)
      const groupMatch = lines[i].match(/group-title="([^"]*)"/)
      const url = lines[i + 1]
      if (url && !url.startsWith('#') && (url.startsWith('http://') || url.startsWith('https://'))) {
        const name = nameMatch ? nameMatch[1].trim() : ''
        const group = groupMatch ? groupMatch[1].trim() : 'General'
        let category = 'Entertainment'
        const g = group.toLowerCase()
        if (g.includes('sport') || g.includes('cricket') || g.includes('football') || g.includes('fifa')) category = 'Sports'
        else if (g.includes('news')) category = 'News'

        channels.push({
          id: `m3u_${Buffer.from(name + url).toString('base64').slice(0, 20)}`,
          name,
          stream_url: url,
          logo_url: logoMatch ? logoMatch[1] : '',
          group,
          category,
          quality: 'HD',
          source: 'm3u',
          is_active: true,
        })
      }
    }
  }
  return channels
}

async function isStreamAlive(url) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2500) // 2.5s timeout for fast checking
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-100' }, // Only ask for 100 bytes so it doesn't download video
      signal: controller.signal,
    })
    clearTimeout(id)
    return res.ok || res.status === 206 // 206 Partial Content means it's alive
  } catch (e) {
    return false
  }
}

export async function GET() {
  try {
    const res = await fetch(M3U_URL, {
      next: { revalidate: 3600 }, // Cache the whole fetch process for 1 hour
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch M3U playlist' }, { status: 502 })
    }
    const text = await res.text()
    const allChannels = parseM3U(text)

    // Concurrently check all streams to find dead ones (takes ~2.5 seconds total)
    const checkResults = await Promise.all(
      allChannels.map(ch => isStreamAlive(ch.stream_url).then(alive => ({ ...ch, alive })))
    )
    
    // Filter out dead channels
    const aliveChannels = checkResults.filter(ch => ch.alive)
    
    // Remove the temporary 'alive' property before sending to client
    aliveChannels.forEach(ch => delete ch.alive)

    return NextResponse.json({ 
      channels: aliveChannels, 
      count: aliveChannels.length,
      deadCount: allChannels.length - aliveChannels.length
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
