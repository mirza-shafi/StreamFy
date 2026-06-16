import { findStreamForMatch, findStreamForChannel } from '@/lib/autoStreamFinder'

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, team1, team2, tournament, name } = body

    let url = null
    if (type === 'match') {
      url = await findStreamForMatch(team1, team2, tournament)
    } else if (type === 'channel') {
      url = await findStreamForChannel(name)
    }

    return Response.json({ url })
  } catch (err) {
    return Response.json({ url: null, error: err.message }, { status: 500 })
  }
}
