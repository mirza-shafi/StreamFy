require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from('matches').select('*')
  const statuses = new Set(data.map(d => d.status))
  console.log('Statuses in DB:', Array.from(statuses))
  
  const anyLive = data.filter(d => d.status.toLowerCase().includes('live'))
  console.log('Matches with "live" in status:', anyLive)
}
run()
