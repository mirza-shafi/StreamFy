const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendAlert(message) {
  if (!TOKEN || !CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }),
    })
  } catch { /* fail silently */ }
}

export function alertStreamDown(name, url) {
  return sendAlert(`● <b>STREAM DOWN</b>\n📺 Match/Channel: ${name}\n✗ Dead URL: ${url}\n🔍 Searching for replacement...`)
}

export function alertStreamFixed(name, newUrl) {
  return sendAlert(`✓ <b>STREAM FIXED</b>\n📺 Match/Channel: ${name}\n🔗 New URL: ${newUrl}\n⚡ Auto-updated successfully`)
}

export function alertStreamNotFound(name) {
  return sendAlert(`⚠️ <b>STREAM NOT FOUND</b>\n📺 Match/Channel: ${name}\n✗ Could not find replacement\n👉 Please update manually in admin panel`)
}

export async function sendTelegramMessage(chatId, text) {
  if (!TOKEN) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    return res.ok
  } catch { return false }
}
