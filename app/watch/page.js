'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import VideoPlayer from '@/components/VideoPlayer'
import Link from 'next/link'

const qualityColors = {
  '4K': 'bg-purple-900/30 text-purple-300 border-purple-700',
  HD: 'bg-blue-900/30 text-blue-300 border-blue-700',
  SD: 'bg-gray-800 text-gray-400 border-gray-600',
}

function WatchContent() {
  const params = useSearchParams()
  const name = params.get('name') || 'Live Channel'
  const url = params.get('url') || ''
  const logo = params.get('logo') || ''
  const category = params.get('cat') || ''
  const quality = params.get('quality') || 'HD'

  if (!url) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-lg font-medium">No stream URL provided.</p>
        <Link href="/channels" className="mt-4 inline-block text-[#e63946] hover:underline">
          ← Back to Channels
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/channels"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        ← Back to Channels
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main player */}
        <div className="xl:col-span-2">
          <VideoPlayer streamUrl={url} title={name} />

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mt-4">
            <div className="flex items-start gap-4">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={name}
                  className="w-14 h-14 rounded-xl object-contain bg-[#2a2a2a] p-1 flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-white">{name}</h1>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityColors[quality] || qualityColors.HD}`}>
                    {quality}
                  </span>
                  {category && <span className="text-sm text-gray-400">{category}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  <span className="text-sm text-green-400 font-medium">Live Stream</span>
                  <span className="text-xs text-gray-600 ml-2">via KB-TV Playlist</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 h-fit">
          <h2 className="text-base font-bold text-white mb-3">Stream Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Quality</span>
              <span className="text-white">{quality}</span>
            </div>
            {category && (
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="text-white">{category}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        <div className="text-5xl mb-4">📺</div>
        <p>Loading stream...</p>
      </div>
    }>
      <WatchContent />
    </Suspense>
  )
}
