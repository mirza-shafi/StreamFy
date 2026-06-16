import { createClient } from '@supabase/supabase-js'
import { checkStream } from '@/lib/streamChecker'
import { findStreamForMatch, findStreamForChannel } from '@/lib/autoStreamFinder'
import { alertStreamDown, alertStreamFixed, alertStreamNotFound } from '@/lib/telegramAlert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const rateLimitMap = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const last = rateLimitMap.get(ip) || 0
  if (now - last < 30000) return true
  rateLimitMap.set(ip, now)
  return false
}

async function logEvent(data) {
  try {
    await supabase.from('stream_logs').insert(data)
  } catch { /* fail silently */ }
}

async function processMatch(match) {
  if (!match.stream_url) return { status: 'skipped' }

  const check = await checkStream(match.stream_url)
  const name = `${match.team1} vs ${match.team2}`
  const now = new Date().toISOString()

  if (check.alive) {
    await supabase.from('matches').update({ stream_status: 'live', stream_last_checked: now }).eq('id', match.id)
    return { status: 'alive' }
  }

  // Stream is dead — find replacement
  await alertStreamDown(name, match.stream_url)
  const backups = [match.stream_url_2, match.stream_url_3].filter(Boolean)
  const newUrl = await findStreamForMatch(match.team1, match.team2, match.tournament, backups)

  if (newUrl) {
    await supabase.from('matches').update({
      stream_url: newUrl, stream_status: 'live', stream_last_checked: now, stream_auto_updated: true
    }).eq('id', match.id)
    await alertStreamFixed(name, newUrl)
    await logEvent({ match_id: match.id, event_type: 'fixed', old_url: match.stream_url, new_url: newUrl, message: 'Auto-replaced dead stream' })
    return { status: 'fixed' }
  }

  await supabase.from('matches').update({ stream_status: 'dead', stream_last_checked: now }).eq('id', match.id)
  await alertStreamNotFound(name)
  await logEvent({ match_id: match.id, event_type: 'dead', old_url: match.stream_url, message: 'Stream dead, no replacement found' })
  return { status: 'dead' }
}

async function processChannel(channel) {
  if (!channel.stream_url) return { status: 'skipped' }

  const check = await checkStream(channel.stream_url)
  const now = new Date().toISOString()

  if (check.alive) {
    await supabase.from('channels').update({ stream_status: 'live', stream_last_checked: now }).eq('id', channel.id)
    return { status: 'alive' }
  }

  await alertStreamDown(channel.name, channel.stream_url)
  const backups = [channel.stream_url_2, channel.stream_url_3].filter(Boolean)
  const newUrl = await findStreamForChannel(channel.name, backups)

  if (newUrl) {
    await supabase.from('channels').update({
      stream_url: newUrl, stream_status: 'live', stream_last_checked: now, stream_auto_updated: true
    }).eq('id', channel.id)
    await alertStreamFixed(channel.name, newUrl)
    await logEvent({ channel_id: channel.id, event_type: 'fixed', old_url: channel.stream_url, new_url: newUrl, message: 'Auto-replaced dead stream' })
    return { status: 'fixed' }
  }

  await supabase.from('channels').update({ stream_status: 'dead', stream_last_checked: now }).eq('id', channel.id)
  await alertStreamNotFound(channel.name)
  await logEvent({ channel_id: channel.id, event_type: 'dead', old_url: channel.stream_url, message: 'Stream dead, no replacement found' })
  return { status: 'dead' }
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isRateLimited(ip)) {
    return Response.json({ error: 'Rate limited. Wait 30 seconds.' }, { status: 429 })
  }

  try {
    const [{ data: matches }, { data: channels }] = await Promise.all([
      supabase.from('matches').select('*').eq('status', 'live'),
      supabase.from('channels').select('*').eq('is_active', true),
    ])

    const results = { checked: 0, fixed: 0, dead: 0, alive: 0, timestamp: new Date().toISOString() }

    const matchResults = await Promise.all((matches || []).map(processMatch))
    const channelResults = await Promise.all((channels || []).map(processChannel))

    for (const r of [...matchResults, ...channelResults]) {
      if (r.status === 'skipped') continue
      results.checked++
      if (r.status === 'fixed') results.fixed++
      else if (r.status === 'dead') results.dead++
      else results.alive++
    }

    return Response.json(results)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
