'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

export default function VideoPlayer({ streamUrl, streamUrl2, streamUrl3, backupStreamUrl, title }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const iframeTimerRef = useRef(null)

  const streams = [streamUrl, streamUrl2 || backupStreamUrl, streamUrl3].filter(Boolean)
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showIframeHint, setShowIframeHint] = useState(false)

  const currentUrl = streams[idx]
  const isHLS = currentUrl?.includes('.m3u8')

  const tryNext = useCallback(() => {
    if (idx < streams.length - 1) {
      setIdx(i => i + 1)
      setError(false)
      setLoading(true)
      setShowIframeHint(false)
    } else {
      setError(true)
      setLoading(false)
    }
  }, [idx, streams.length])

  useEffect(() => {
    setLoading(true)
    setError(false)
    setShowIframeHint(false)
    clearTimeout(iframeTimerRef.current)

    if (!currentUrl) { setError(true); setLoading(false); return }
    if (!isHLS) {
      setLoading(false)
      // Show "try next" hint after 10s for iframes
      if (streams.length > 1) {
        iframeTimerRef.current = setTimeout(() => setShowIframeHint(true), 10000)
      }
      return
    }

    let hls
    const init = async () => {
      const Hls = (await import('hls.js')).default
      if (hlsRef.current) { hlsRef.current.destroy() }

      if (Hls.isSupported()) {
        hls = new Hls()
        hlsRef.current = hls
        hls.loadSource(currentUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false)
          videoRef.current?.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) tryNext()
        })
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = currentUrl
        videoRef.current.onloadedmetadata = () => setLoading(false)
        videoRef.current.onerror = () => tryNext()
      } else {
        tryNext()
      }
    }
    init()

    return () => {
      clearTimeout(iframeTimerRef.current)
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [currentUrl, isHLS, tryNext])

  const reset = () => { setIdx(0); setError(false); setLoading(true) }

  return (
    <div className="w-full">
      {/* Stream selector */}
      {streams.length > 1 && (
        <div className="flex gap-2 mb-3">
          {streams.map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); setError(false); setLoading(true) }}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                idx === i ? 'bg-[#e63946] text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
              }`}>
              Stream {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
            <div className="w-10 h-10 border-[3px] border-[#e63946] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading stream...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-4 text-center gap-3">
            <div className="text-4xl">📡</div>
            <p className="text-white font-semibold">All streams unavailable</p>
            <p className="text-gray-400 text-sm">Could not load any stream source.</p>
            <button onClick={reset}
              className="px-4 py-2 bg-[#e63946] text-white rounded-lg text-sm hover:bg-red-500 transition-colors">
              ↺ Retry Stream 1
            </button>
          </div>
        )}

        {!error && (
          isHLS ? (
            <video ref={videoRef}
              className="absolute inset-0 w-full h-full"
              controls playsInline title={title} />
          ) : (
            <iframe src={currentUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen allow="autoplay; encrypted-media"
              title={title}
              onLoad={() => setLoading(false)} />
          )
        )}
      </div>

      {/* Iframe hint */}
      {showIframeHint && !error && streams.length > idx + 1 && (
        <div className="mt-2 flex items-center justify-between bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
          <span className="text-yellow-400 text-xs">Stream not working?</span>
          <button onClick={tryNext}
            className="text-xs px-3 py-1 bg-[#e63946] text-white rounded hover:bg-red-500 transition-colors">
            Try Stream {idx + 2}
          </button>
        </div>
      )}
    </div>
  )
}
