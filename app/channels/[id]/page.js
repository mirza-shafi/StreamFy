import { supabase } from '@/lib/supabase'
import VideoPlayer from '@/components/VideoPlayer'
import ChannelCard from '@/components/ChannelCard'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }) {
  const { data } = await supabase.from('channels').select('name,category').eq('id', params.id).single()
  if (!data) return { title: 'Channel Not Found' }
  return {
    title: `${data.name} - Watch Live | StreamFy`,
    description: `Stream ${data.name} live on StreamFy`,
  }
}

export const revalidate = 60

export default async function WatchChannelPage({ params }) {
  const [{ data: channel }, { data: others }] = await Promise.all([
    supabase.from('channels').select('*').eq('id', params.id).single(),
    supabase.from('channels').select('*').neq('id', params.id).eq('is_active', true).limit(8),
  ])

  if (!channel) notFound()

  const qualityColors = {
    '4K': 'bg-purple-900/30 text-purple-300 border-purple-700',
    HD: 'bg-blue-900/30 text-blue-300 border-blue-700',
    SD: 'bg-gray-800 text-gray-400 border-gray-600',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main */}
        <div className="xl:col-span-2">
          <VideoPlayer streamUrl={channel.stream_url} streamUrl2={channel.stream_url_2} streamUrl3={channel.stream_url_3} title={channel.name} />

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mt-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{channel.name}</h1>
              {channel.quality && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityColors[channel.quality] || qualityColors.HD}`}>
                  {channel.quality}
                </span>
              )}
              {channel.category && <span className="text-sm text-gray-400">{channel.category}</span>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {others?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">More Channels</h2>
            <div className="grid grid-cols-2 gap-3">
              {others.map((c) => <ChannelCard key={c.id} channel={c} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
