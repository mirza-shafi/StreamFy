require('dotenv').config({ path: '.env.local' })
const FD_KEY = process.env.FOOTBALL_DATA_API_KEY
async function fetchFootballDataOrg() {
  const matches = []
  const competitions = ['WC']
  for (const comp of competitions) {
    try {
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/${comp}/matches?status=LIVE,IN_PLAY,PAUSED,TIMED,SCHEDULED`,
        { headers: { 'X-Auth-Token': FD_KEY } }
      )
      const data = await res.json()
      for (const m of data.matches || []) {
        if (m.homeTeam?.name?.includes('France')) {
          const t = `${m.competition?.name || comp} ${m.stage?.replace(/_/g, ' ') || ''}`.trim()
          console.log('France match tournament:', t)
          console.log('Team 1:', m.homeTeam?.name)
          console.log('Team 2:', m.awayTeam?.name)
        }
      }
    } catch(e) { console.error(e) }
  }
}
fetchFootballDataOrg()
