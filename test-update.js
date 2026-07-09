require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const FD_KEY = process.env.FOOTBALL_DATA_API_KEY

async function run() {
  const res = await fetch(`https://api.football-data.org/v4/competitions/WC/matches?status=LIVE,IN_PLAY,PAUSED,TIMED,SCHEDULED`, { headers: { 'X-Auth-Token': FD_KEY } })
  const data = await res.json()
  for (const m of data.matches || []) {
    if (m.homeTeam?.name?.includes('France')) {
      const rawStatus = m.status
      let status = 'upcoming'
      if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(rawStatus)) status = 'live'
      else if (['FINISHED', 'AWARDED'].includes(rawStatus)) status = 'finished'
      
      console.log('API Status:', status, 'Raw:', rawStatus)
      const t1 = m.homeTeam?.name
      const t2 = m.awayTeam?.name
      const tournament = `${m.competition?.name || 'WC'} ${m.stage?.replace(/_/g, ' ') || ''}`.trim()
      
      const { data: existing, error } = await supabase
        .from('matches').select('id,status')
        .eq('team1', t1).eq('team2', t2)
        .eq('tournament', tournament).maybeSingle()
        
      console.log('Existing:', existing, error)
      
      if (existing) {
        const { data: updateData, error: updateErr } = await supabase.from('matches').update({
          status: status,
        }).eq('id', existing.id).select()
        console.log('Update result:', updateData, updateErr)
      }
    }
  }
}
run()
