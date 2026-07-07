require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data } = await supabase.from('matches').select('id, team1, team2, status, match_time').order('match_time', { ascending: false }).limit(20)
  console.log(data)
}
test()
