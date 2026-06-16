'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const path = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/live', label: 'Live', live: true },
    { href: '/matches', label: 'Matches' },
    { href: '/channels', label: 'TV Channels' },
  ]

  const active = (href) =>
    path === href ? 'text-[#e63946]' : 'text-gray-300 hover:text-white'

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#111111] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[#e63946] text-2xl">●</span>
          <span className="text-white font-bold text-xl">StreamFy</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ href, label, live }) => (
            <Link key={href} href={href} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${active(href)}`}>
              {live && <span className="w-2 h-2 rounded-full bg-[#e63946] live-dot" />}
              {label}
            </Link>
          ))}
        </div>

        {/* Hamburger */}
        <button className="md:hidden text-white p-1" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#111111] border-t border-[#2a2a2a] px-4 py-3 flex flex-col gap-3">
          {links.map(({ href, label, live }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-2 text-sm font-medium py-1 ${active(href)}`}>
              {live && <span className="w-2 h-2 rounded-full bg-[#e63946] live-dot" />}
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
