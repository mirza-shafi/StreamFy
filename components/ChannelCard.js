import Link from 'next/link'
import Image from 'next/image'

const qualityColors = {
  '4K': 'bg-purple-900/50 text-purple-300 border-purple-700',
  HD: 'bg-blue-900/50 text-blue-300 border-blue-700',
  SD: 'bg-gray-800 text-gray-400 border-gray-600',
}

export default function ChannelCard({ channel }) {
  const { id, name, logo_url, quality, category } = channel

  return (
    <Link href={`/channels/${id}`}
      className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#e63946] hover:shadow-lg hover:shadow-red-900/20 transition-all duration-200 group text-center">
      {/* Logo */}
      <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
        {logo_url ? (
          <Image src={logo_url} alt={name} width={64} height={64} className="object-contain" />
        ) : (
          <span className="text-2xl">📺</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white truncate mb-2 group-hover:text-[#e63946] transition-colors">{name}</h3>

      <div className="flex items-center justify-center gap-2">
        {quality && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityColors[quality] || qualityColors.HD}`}>
            {quality}
          </span>
        )}
        {category && <span className="text-xs text-gray-500">{category}</span>}
      </div>
    </Link>
  )
}
