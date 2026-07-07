import { supabase } from '@/lib/supabase'

export default async function sitemap() {
  const baseUrl = 'https://streamfy.mirzashafi.com'

  // Fetch matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('id, created_at')
    .eq('is_active', true)

  const matchUrls = (matches || []).map((match) => ({
    url: `${baseUrl}/matches/${match.id}`,
    lastModified: match.updated_at || match.created_at || new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const channelUrls = (channels || []).map((channel) => ({
    url: `${baseUrl}/channels/${channel.id}`,
    lastModified: channel.created_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/live`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/channels`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  return [...staticUrls, ...matchUrls, ...channelUrls]
}
