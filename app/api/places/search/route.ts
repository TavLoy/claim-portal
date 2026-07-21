import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/places'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')
  const type = searchParams.get('type') || 'Pub'
  const radius = parseFloat(searchParams.get('radius') || '3')

  if (!location) {
    return NextResponse.json({ error: 'location is required' }, { status: 400 })
  }

  try {
    const results = await searchPlaces(location, type, radius)
    return NextResponse.json({ results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('[places/search]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
