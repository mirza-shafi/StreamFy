import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const HEADERS = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'Content-Type': 'application/json',
}

const COUNTRY_FLAGS = {
  India: '🇮🇳', Bangladesh: '🇧🇩', Pakistan: '🇵🇰', Australia: '🇦🇺',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'New Zealand': '🇳🇿', 'South Africa': '🇿🇦',
  'West Indies': '🏝️', Afghanistan: '🇦🇫', 'Sri Lanka': '🇱🇰',
  Zimbabwe: '🇿🇼', Ireland: '🇮🇪', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Netherlands: '🇳🇱',
  'UAE': '🇦🇪', Nepal: '🇳🇵', Oman: '🇴🇲', Canada: '🇨🇦', USA: '🇺🇸',
  Argentina: '🇦🇷', Brazil: '🇧🇷', France: '🇫🇷', Germany: '🇩🇪',
  Spain: '🇪🇸', Italy: '🇮🇹', Portugal: '🇵🇹', Mexico: '🇲🇽',
}

function getFlag(name) {
  if (!name) return '🏆'
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (name.toLowerCase().includes(country.toLowerCase())) return flag
  }
  return '🏆'
}

async function fetchCricket() {
  const matches = []
  try {
    // Fetch live + upcoming
    const [liveRes, upcomingRes] = await Promise.all([
      fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers: { ...HEADERS, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' } }),
      fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', { headers: { ...HEADERS, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' } }),
    ])

    const processData = (data, defaultStatus) => {
      for (const typeMatch of data.typeMatches || []) {
        for (const series of typeMatch.seriesMatches || []) {
          const wrapper = series.seriesAdWrapper || series
          for (const m of wrapper.matches || []) {
            const mi = m.matchInfo || {}
            const t1 = mi.team1?.teamName
            const t2 = mi.team2?.teamName
            if (!t1 || !t2) continue

            const state = mi.state?.toLowerCase() || ''
            let status = defaultStatus
            if (state.includes('live') || state.includes('progress')) status = 'live'
            else if (state.includes('complete') || state.includes('finish')) status = 'finished'

            const startMs = parseInt(mi.startDate)
            const matchTime = startMs ? new Date(startMs).toISOString() : null

            matches.push({
              external_id: `cricket_${mi.matchId}`,
              team1: t1,
              team2: t2,
              team1_flag: getFlag(t1),
              team2_flag: getFlag(t2),
              tournament: mi.seriesName || 'Cricket',
              match_time: matchTime,
              status,
              sport: 'cricket',
            })
          }
        }
      }
    }

    if (liveRes.ok) processData(await liveRes.json(), 'live')
    if (upcomingRes.ok) processData(await upcomingRes.json(), 'upcoming')
  } catch { /* fail silently */ }
  return matches
}

async function fetchFootball() {
  const matches = []
  try {
    const [liveRes, upcomingRes] = await Promise.all([
      fetch('https://free-api-live-football-data.p.rapidapi.com/football-current-live', { headers: { ...HEADERS, 'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com' } }),
      fetch('https://free-api-live-football-data.p.rapidapi.com/football-get-all-upcoming', { headers: { ...HEADERS, 'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com' } }),
    ])

    if (liveRes.ok) {
      const data = await liveRes.json()
      for (const m of data?.response?.live || []) {
        const t1 = m.home?.name || m.home?.longName
        const t2 = m.away?.name || m.away?.longName
        if (!t1 || !t2) continue
        matches.push({
          external_id: `football_${m.id}`,
          team1: t1,
          team2: t2,
          team1_flag: getFlag(t1),
          team2_flag: getFlag(t2),
          tournament: 'Football',
          match_time: m.status?.utcTime || new Date(m.timeTS).toISOString(),
          status: 'live',
          sport: 'football',
        })
      }
    }

    if (upcomingRes.ok) {
      const data = await upcomingRes.json()
      const list = data?.response?.upcoming || data?.response || []
      for (const m of Array.isArray(list) ? list.slice(0, 30) : []) {
        const t1 = m.home?.name || m.home?.longName
        const t2 = m.away?.name || m.away?.longName
        if (!t1 || !t2) continue
        matches.push({
          external_id: `football_${m.id}`,
          team1: t1,
          team2: t2,
          team1_flag: getFlag(t1),
          team2_flag: getFlag(t2),
          tournament: 'Football',
          match_time: m.status?.utcTime || (m.timeTS ? new Date(m.timeTS).toISOString() : null),
          status: 'upcoming',
          sport: 'football',
        })
      }
    }
  } catch { /* fail silently */ }
  return matches
}

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [cricket, football] = await Promise.all([fetchCricket(), fetchFootball()])
    const all = [...cricket, ...football]

    if (!all.length) {
      return Response.json({ synced: 0, message: 'No matches from API' })
    }

    // Check if external_id column exists, if not upsert by team names
    let synced = 0
    for (const match of all) {
      const { external_id, sport, ...fields } = match

      // Try to find existing match by team names + tournament to avoid duplication
      const { data: existing } = await supabase
        .from('matches')
        .select('id, stream_url')
        .eq('team1', fields.team1)
        .eq('team2', fields.team2)
        .single()

      if (existing) {
        // Update status and time but preserve stream URLs
        await supabase.from('matches').update({
          status: fields.status,
          match_time: fields.match_time,
          tournament: fields.tournament,
        }).eq('id', existing.id)
      } else {
        await supabase.from('matches').insert(fields)
      }
      synced++
    }

    return Response.json({
      synced,
      cricket: cricket.length,
      football: football.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
