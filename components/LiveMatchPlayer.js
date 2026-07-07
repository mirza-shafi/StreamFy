'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Sport keyword matching ───────────────────────────────────────────────────
function getMatchKeywords(match) {
  const words = [
    match.team1, match.team2, match.tournament,
  ].filter(Boolean).join(' ').toLowerCase()
  const keys = new Set()

  if (words.includes('world cup') || words.includes('fifa')) {
    keys.add('sports'); keys.add('t sports'); keys.add('btv'); keys.add('somoy')
    keys.add('tsport'); keys.add('world cup'); keys.add('fifa'); keys.add('bein')
    keys.add('unite'); keys.add('616'); keys.add('fox'); keys.add('ptv'); keys.add('tvp')
  } else if (words.includes('cricket') || words.includes('icc') || words.includes('t20')) {
    keys.add('sports'); keys.add('t sports'); keys.add('tsport'); keys.add('cricket')
    keys.add('star sports'); keys.add('ten sports')
  } else {
    keys.add('sports')
  }
  return keys
}

function filterM3UChannels(m3uChannels, match) {
  const keys = getMatchKeywords(match)
  return m3uChannels.filter((ch) => {
    const name = ch.name?.toLowerCase() || ''
    for (const k of keys) { if (name.includes(k)) return true }
    return false
  }).slice(0, 20).map(ch => ({
    // Normalize: always expose .url (M3U uses stream_url, DB streams use url)
    ...ch,
    url: ch.url || ch.stream_url,
  }))
}

// ─── HLS Player core ─────────────────────────────────────────────────────────
function HLSPlayer({ url, title, onError, onReady }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    if (!url || !videoRef.current) return
    const isHLS = url.includes('.m3u8') || url.includes('mpegurl') || url.endsWith('.php')

    const cleanup = () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null } }

    if (!isHLS) {
      onReady?.()
      return
    }

    const init = async () => {
      const Hls = (await import('hls.js')).default
      cleanup()

      let timer = null
      const startTimeout = () => {
        timer = setTimeout(() => {
          cleanup()
          onError?.()
        }, 12000) // 12 seconds max loading
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 1,
          manifestLoadingTimeOut: 8000,
          levelLoadingMaxRetry: 1,
          levelLoadingTimeOut: 8000,
          fragLoadingMaxRetry: 1,
          fragLoadingTimeOut: 8000,
        })
        hlsRef.current = hls
        startTimeout()
        hls.loadSource(url)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          clearTimeout(timer)
          onReady?.()
          videoRef.current?.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_, d) => {
          if (d.fatal) {
            clearTimeout(timer)
            cleanup()
            onError?.()
          }
        })
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        startTimeout()
        videoRef.current.src = url
        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timer)
          onReady?.()
        }
        videoRef.current.onerror = () => {
          clearTimeout(timer)
          onError?.()
        }
      } else {
        onError?.()
      }
    }
    init()
    return () => {
      cleanup()
    }
  }, [url, onError, onReady])

  const isHLS = url?.includes('.m3u8') || url?.includes('mpegurl') || url?.endsWith('.php')

  if (!isHLS) {
    return (
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="autoplay; encrypted-media"
        title={title}
        onLoad={() => onReady?.()}
      />
    )
  }
  return <video ref={videoRef} className="absolute inset-0 w-full h-full" controls playsInline title={title} />
}

// ─── Main LiveMatchPlayer ─────────────────────────────────────────────────────
export default function LiveMatchPlayer({ match }) {
  const [m3uChannels, setM3uChannels] = useState([])
  const [m3uLoaded, setM3uLoaded] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [playerState, setPlayerState] = useState('loading') // loading | playing | error

  // Build DB streams from match data
  const dbStreams = [
    match.stream_url && { id: 'db-1', name: 'Stream 1', url: match.stream_url, source: 'db' },
    (match.stream_url_2 || match.backup_stream_url) && {
      id: 'db-2', name: 'Stream 2', url: match.stream_url_2 || match.backup_stream_url, source: 'db',
    },
    match.stream_url_3 && { id: 'db-3', name: 'Stream 3', url: match.stream_url_3, source: 'db' },
  ].filter(Boolean)

  // Filter relevant M3U channels for this match
  const relevantM3U = filterM3UChannels(m3uChannels, match)

  // All channels merged — filter out HTTP streams on HTTPS sites (Mixed Content block)
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const allChannels = [...dbStreams, ...relevantM3U].filter(
    ch => ch.url && (!isHttps || ch.url.startsWith('https://'))
  )
  const activeChannel = allChannels[activeIdx]

  // Fetch M3U channels
  useEffect(() => {
    fetch('/api/m3u-channels')
      .then((r) => r.json())
      .then(({ channels }) => { setM3uChannels(channels || []); setM3uLoaded(true) })
      .catch(() => setM3uLoaded(true))
  }, [])

  const handleError = useCallback(() => {
    setPlayerState('error')
    // Automatically skip to next channel if available
    setActiveIdx((current) => {
      if (current < allChannels.length - 1) {
        setTimeout(() => setPlayerState('loading'), 1500) // brief delay to show skip
        return current + 1
      }
      return current // stay on last channel if no more
    })
  }, [allChannels.length])

  const handleReady = useCallback(() => {
    setPlayerState('playing')
  }, [])

  const switchChannel = (idx) => {
    setActiveIdx(idx)
    setPlayerState('loading')
  }

  const retry = () => {
    setPlayerState('loading')
  }

  const title = `${match.team1} vs ${match.team2}`

  if (!allChannels.length && !m3uLoaded) {
    return (
      <div className="w-full">
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3">
            <div className="w-10 h-10 border-[3px] border-[#e63946] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Finding best stream...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!allChannels.length) {
    return (
      <div className="w-full">
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3 text-center px-4">
            <div className="text-4xl">📡</div>
            <p className="text-white font-semibold">No compatible streams available</p>
            <p className="text-gray-400 text-sm">Either no streams exist, or they are blocked by browser security (HTTP).</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* ── Channel Chooser ── */}
      <div className="mb-3">
        {/* DB Streams row */}
        {dbStreams.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {dbStreams.map((ch, i) => {
              // Find its index in allChannels
              const globalIdx = allChannels.findIndex(a => a.id === ch.id)
              if (globalIdx === -1) return null
              return (
              <button
                key={ch.id}
                onClick={() => switchChannel(globalIdx)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeIdx === globalIdx
                    ? 'bg-[#e63946] text-white shadow-lg shadow-red-900/30'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] border border-[#3a3a3a]'
                }`}
              >
                {activeIdx === globalIdx && playerState === 'playing' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {ch.name}
              </button>
            )})}
          </div>
        )}

        {/* M3U Channels scrollable row */}
        {relevantM3U.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
            <span className="text-xs text-gray-600 self-center shrink-0 pr-1">📺 Live Channels:</span>
            {relevantM3U.map((ch, i) => {
              const globalIdx = allChannels.findIndex(a => a.id === ch.id)
              if (globalIdx === -1) return null
              return (
                <button
                  key={ch.id}
                  onClick={() => switchChannel(globalIdx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    activeIdx === globalIdx
                      ? 'bg-[#e63946] text-white shadow-lg shadow-red-900/30 border border-red-700'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-gray-600'
                  }`}
                >
                  {ch.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ch.logo_url}
                      alt=""
                      className="w-5 h-5 rounded object-contain"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <span className="text-sm">📺</span>
                  )}
                  <span className="truncate max-w-[100px]">{ch.name}</span>
                  {activeIdx === globalIdx && playerState === 'playing' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!m3uLoaded && (
          <p className="text-xs text-gray-600 mt-1">Loading more channels...</p>
        )}
      </div>

      {/* ── Video Player ── */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
        {/* Loading overlay */}
        {playerState === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
            <div className="w-10 h-10 border-[3px] border-[#e63946] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">
              Loading <span className="text-white font-medium">{activeChannel?.name}</span>...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {playerState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-4 text-center gap-3">
            <div className="text-4xl">📡</div>
            <p className="text-white font-semibold">{activeChannel?.name} unavailable</p>
            <p className="text-gray-400 text-sm">
              {activeIdx < allChannels.length - 1 
                ? 'Auto-skipping to next channel...' 
                : 'No more working channels.'}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={retry}
                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
              >
                ↺ Retry manually
              </button>
            </div>
          </div>
        )}

        {/* Player */}
        {activeChannel && (
          <HLSPlayer
            key={activeChannel.url}
            url={activeChannel.url}
            title={title}
            onError={handleError}
            onReady={handleReady}
          />
        )}
      </div>

      {/* Now playing bar */}
      {playerState === 'playing' && activeChannel && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Playing: <span className="text-gray-300 font-medium">{activeChannel.name}</span></span>
          {activeChannel.source === 'm3u' && (
            <span className="ml-auto text-gray-600">via KB-TV Live</span>
          )}
        </div>
      )}
    </div>
  )
}
