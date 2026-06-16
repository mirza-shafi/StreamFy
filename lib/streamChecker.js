export async function checkStream(url) {
  if (!url) return { alive: false, error: 'No URL provided', responseTime: 0 }

  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const isM3U8 = url.includes('.m3u8')
    const method = isM3U8 ? 'GET' : 'HEAD'

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 StreamChecker/1.0' },
    })

    clearTimeout(timeout)
    const responseTime = Date.now() - start

    if (isM3U8) {
      const text = await res.text().catch(() => '')
      const alive = res.ok && (text.includes('#EXTM3U') || text.includes('#EXT-X'))
      return { alive, responseTime, error: alive ? null : 'Invalid M3U8 response' }
    }

    return { alive: res.ok || res.status === 405, responseTime, error: res.ok ? null : `HTTP ${res.status}` }
  } catch (err) {
    clearTimeout(timeout)
    return { alive: false, responseTime: Date.now() - start, error: err.message }
  }
}
