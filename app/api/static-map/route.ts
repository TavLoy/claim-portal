import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// Server-side proxy for Google Static Maps — keeps the API key off the client.
// Requires "Maps Static API" enabled separately in Google Cloud Console
// (it is a different product from the Places API already in use).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const w = searchParams.get('w') || '400'
  const h = searchParams.get('h') || '160'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=${w}x${h}&scale=2&maptype=roadmap&markers=color:0xCC9901%7C${lat},${lng}&key=${API_KEY}`

  try {
    const res = await fetch(mapUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch map image' }, { status: 502 })
    }
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Map fetch failed' }, { status: 500 })
  }
}
