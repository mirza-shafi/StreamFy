require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function run() {
  const { data } = await supabase.from('matches').select('*').ilike('team1', '%France%').order('match_time', { ascending: false }).limit(2)
  console.log("Matches:", data)
}
run()
