import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  metadataBase: new URL('https://streamfy.vercel.app'),
  title: { default: 'StreamFy - Live Sports Streaming', template: '%s | StreamFy' },
  description: 'Watch live sports matches, football, cricket, and more on StreamFy.',
  keywords: 'live sports, streaming, football, cricket, watch live',
  openGraph: {
    siteName: 'StreamFy',
    type: 'website',
    images: [{ url: '/og-image.jpg' }],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
