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
        // Map group to app category
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

export async function GET() {
  try {
    const res = await fetch(M3U_URL, {
      next: { revalidate: 3600 }, // cache for 1 hour
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch M3U playlist' }, { status: 502 })
    }
    const text = await res.text()
    const channels = parseM3U(text)
    return NextResponse.json({ channels, count: channels.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
