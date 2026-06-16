export async function POST(request) {
  try {
    const { password } = await request.json()
    const correct = process.env.ADMIN_PASSWORD
    if (!correct || password !== correct) {
      return Response.json({ ok: false }, { status: 401 })
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
}
