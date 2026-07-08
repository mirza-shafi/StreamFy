'use client'
import { useEffect, useState } from 'react'

export default function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      setTime(t)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return (
    <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 text-xs px-3 py-1 rounded-full font-mono tabular-nums">
      🕐 {time}
    </span>
  )
}
