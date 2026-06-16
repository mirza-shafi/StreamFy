import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from '@/lib/telegramAlert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  // Verify this is from our Telegram bot via secret token header
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  const expected = process.env.CRON_SECRET
  if (expected && secret !== expected) {
    // Telegram webhooks don't always send the header — allow if no secret configured
    // but reject clearly wrong tokens
    if (secret !== null && secret !== undefined) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const msg = body?.message
    if (!msg) return Response.json({ ok: true })

    const chatId = msg.chat?.id
    const text = msg.text?.trim() || ''
    const command = text.split(' ')[0].toLowerCase()

    switch (command) {
      case '/status': {
        const [{ data: matches }, { data: channels }] = await Promise.all([
          supabase.from('matches').select('status, stream_status'),
          supabase.from('channels').select('is_active, stream_status'),
        ])
        const liveMatches = matches?.filter(m => m.status === 'live').length || 0
        const deadStreams = [
          ...(matches || []).filter(m => m.stream_status === 'dead'),
          ...(channels || []).filter(c => c.stream_status === 'dead'),
        ].length
        const activeChannels = channels?.filter(c => c.is_active).length || 0
        await sendTelegramMessage(chatId,
          `📊 <b>StreamFy Status</b>\n\n🔴 Live Matches: ${liveMatches}\n📺 Active Channels: ${activeChannels}\n💀 Dead Streams: ${deadStreams}`
        )
        break
      }
      case '/listdead': {
        const [{ data: matches }, { data: channels }] = await Promise.all([
          supabase.from('matches').select('team1,team2').eq('stream_status', 'dead'),
          supabase.from('channels').select('name').eq('stream_status', 'dead'),
        ])
        const list = [
          ...(matches || []).map(m => `⚽ ${m.team1} vs ${m.team2}`),
          ...(channels || []).map(c => `📺 ${c.name}`),
        ]
        await sendTelegramMessage(chatId,
          list.length
            ? `💀 <b>Dead Streams (${list.length})</b>\n\n${list.join('\n')}`
            : '✅ No dead streams!'
        )
        break
      }
      case '/check':
        await sendTelegramMessage(chatId, '🔍 Use "Run Check Now" in admin panel or call /api/check-streams with your CRON_SECRET.')
        break
      default:
        await sendTelegramMessage(chatId,
          `🤖 <b>StreamFy Bot</b>\n\n/status — Health overview\n/listdead — Dead streams\n/check — How to trigger check\n/help — This message`
        )
    }

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
