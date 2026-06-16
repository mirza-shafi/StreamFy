import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#111111] border-t border-[#2a2a2a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#e63946] text-xl">●</span>
            <span className="font-bold text-lg">StreamFy</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/live" className="hover:text-white transition-colors">Live</Link>
            <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
            <Link href="/channels" className="hover:text-white transition-colors">Channels</Link>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} StreamFy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
