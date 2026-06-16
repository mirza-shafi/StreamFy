import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const FD_KEY = process.env.FOOTBALL_DATA_API_KEY

const COUNTRY_FLAGS = {
  'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Spain': '🇪🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Portugal': '🇵🇹', 'Italy': '🇮🇹',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Uruguay': '🇺🇾',
  'Mexico': '🇲🇽', 'United States': '🇺🇸', 'USA': '🇺🇸', 'Canada': '🇨🇦',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Morocco': '🇲🇦',
  'Senegal': '🇸🇳', 'Ghana': '🇬🇭', 'Nigeria': '🇳🇬', 'Cameroon': '🇨🇲',
  'Ecuador': '🇪🇨', 'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Peru': '🇵🇪',
  'Poland': '🇵🇱', 'Switzerland': '🇨🇭', 'Denmark': '🇩🇰', 'Sweden': '🇸🇪',
  'Serbia': '🇷🇸', 'Ukraine': '🇺🇦', 'Turkey': '🇹🇷', 'Iran': '🇮🇷',
  'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦', 'Algeria': '🇩🇿', 'Egypt': '🇪🇬',
  'India': '🇮🇳', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Afghanistan': '🇦🇫',
  'South Africa': '🇿🇦', 'New Zealand': '🇳🇿', 'Sri Lanka': '🇱🇰',
  'West Indies': '🏝️', 'Ireland': '🇮🇪', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Austria': '🇦🇹', 'Norway': '🇳🇴', 'Iraq': '🇮🇶', 'Jordan': '🇯🇴',
  'Congo DR': '🇨🇩', 'Panama': '🇵🇦', 'Uzbekistan': '🇺🇿', 'Czechia': '🇨🇿',
  'Bosnia-Herzegovina': '🇧🇦', 'Paraguay': '🇵🇾', 'Venezuela': '🇻🇪',
}

function getFlag(name) {
  if (!name) return '🏆'
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (name.toLowerCase().includes(country.toLowerCase())) return flag
  }
  return '🏆'
}

// football-data.org: fetch World Cup + top competitions
async function fetchFootballDataOrg() {
  if (!FD_KEY) return []
  const matches = []
  // WC = World Cup, CL = Champions League, PL = Premier League, PD = La Liga, SA = Serie A, BL1 = Bundesliga
  const competitions = ['WC']
  
  for (const comp of competitions) {
    try {
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/${comp}/matches?status=LIVE,IN_PLAY,PAUSED,TIMED,SCHEDULED`,
        { headers: { 'X-Auth-Token': FD_KEY } }
      )
      if (!res.ok) continue
      // Respect rate limit headers
      const data = await res.json()
      for (const m of data.matches || []) {
        const t1 = m.homeTeam?.name
        const t2 = m.awayTeam?.name
        if (!t1 || !t2 || t1 === 'TBD' || t2 === 'TBD') continue

        const rawStatus = m.status
        let status = 'upcoming'
        if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(rawStatus)) status = 'live'
        else if (['FINISHED', 'AWARDED'].includes(rawStatus)) status = 'finished'

        matches.push({
          external_id: `fd_${m.id}`,
          team1: t1,
          team2: t2,
          team1_flag: getFlag(t1),
          team2_flag: getFlag(t2),
          tournament: `${m.competition?.name || comp} ${m.stage?.replace(/_/g, ' ') || ''}`.trim(),
          match_time: m.utcDate || null,
          status,
        })
      }
    } catch { continue }
  }
  return matches
}

// RapidAPI cricket
async function fetchCricket() {
  if (!RAPIDAPI_KEY) return []
  const matches = []
  const hdrs = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
  try {
    const [liveRes, upRes] = await Promise.all([
      fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers: hdrs }),
      fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', { headers: hdrs }),
    ])

    const process = (data, defaultStatus) => {
      for (const tm of data.typeMatches || []) {
        for (const s of tm.seriesMatches || []) {
          const w = s.seriesAdWrapper || s
          for (const m of w.matches || []) {
            const mi = m.matchInfo || {}
            const t1 = mi.team1?.teamName
            const t2 = mi.team2?.teamName
            if (!t1 || !t2) continue
            const state = mi.state?.toLowerCase() || ''
            let status = defaultStatus
            if (state.includes('progress') || state.includes('live')) status = 'live'
            else if (state.includes('complete') || state.includes('finish')) status = 'finished'
            const startMs = parseInt(mi.startDate)
            matches.push({
              external_id: `cricket_${mi.matchId}`,
              team1: t1, team2: t2,
              team1_flag: getFlag(t1), team2_flag: getFlag(t2),
              tournament: mi.seriesName || 'Cricket',
              match_time: startMs ? new Date(startMs).toISOString() : null,
              status,
            })
          }
        }
      }
    }
    if (liveRes.ok) process(await liveRes.json(), 'live')
    if (upRes.ok) process(await upRes.json(), 'upcoming')
  } catch { }
  return matches
}

export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [football, cricket] = await Promise.all([fetchFootballDataOrg(), fetchCricket()])
    const all = [...football, ...cricket]

    if (!all.length) return Response.json({ synced: 0, message: 'No matches from APIs' })

    let synced = 0
    for (const { external_id, ...fields } of all) {
      const { data: existing } = await supabase
        .from('matches').select('id,stream_url,stream_url_2,stream_url_3')
        .eq('team1', fields.team1).eq('team2', fields.team2)
        .eq('tournament', fields.tournament).maybeSingle()

      if (existing) {
        await supabase.from('matches').update({
          status: fields.status,
          match_time: fields.match_time,
          team1_flag: fields.team1_flag,
          team2_flag: fields.team2_flag,
        }).eq('id', existing.id)
      } else {
        await supabase.from('matches').insert(fields)
      }
      synced++
    }

    return Response.json({
      synced,
      football: football.length,
      cricket: cricket.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
