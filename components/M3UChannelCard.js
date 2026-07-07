'use client'
import { useRouter } from 'next/navigation'

const qualityColors = {
  '4K': 'bg-purple-900/50 text-purple-300 border-purple-700',
  HD: 'bg-blue-900/50 text-blue-300 border-blue-700',
  SD: 'bg-gray-800 text-gray-400 border-gray-600',
}

export default function M3UChannelCard({ channel }) {
  const { id, name, logo_url, quality, category, stream_url } = channel
  const router = useRouter()

  const handleClick = () => {
    // Encode stream info into URL params for the watch page
    const params = new URLSearchParams({
      name: name || '',
      url: stream_url || '',
      logo: logo_url || '',
      cat: category || '',
      quality: quality || 'HD',
    })
    router.push(`/watch?${params.toString()}`)
  }

  return (
    <button
      onClick={handleClick}
      className="block w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#e63946] hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200 group text-center cursor-pointer"
    >
      {/* Logo */}
      <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
        {logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo_url}
            alt={name}
            width={64}
            height={64}
            className="object-contain w-full h-full"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <span className="text-2xl" style={{ display: logo_url ? 'none' : 'flex' }}>📺</span>
      </div>

      <h3 className="text-sm font-semibold text-white truncate mb-2 group-hover:text-[#e63946] transition-colors">
        {name}
      </h3>

      <div className="flex items-center justify-center gap-2">
        {quality && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityColors[quality] || qualityColors.HD}`}>
            {quality}
          </span>
        )}
        {category && <span className="text-xs text-gray-500">{category}</span>}
      </div>

      {/* Live badge */}
      <div className="mt-2 flex items-center justify-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
        <span className="text-xs text-green-500 font-medium">LIVE</span>
      </div>
    </button>
  )
}
