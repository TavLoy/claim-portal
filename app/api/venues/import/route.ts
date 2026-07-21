import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPlaceDetails, getPhotoUrl, generateTagline } from '@/lib/places'

export async function POST(req: NextRequest) {
  const { place_ids } = await req.json()

  if (!Array.isArray(place_ids) || place_ids.length === 0) {
    return NextResponse.json({ error: 'place_ids array required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    place_ids.map(async (placeId: string) => {
      // Check not already imported
      const { data: existing } = await supabaseAdmin
        .from('venues')
        .select('id')
        .eq('google_place_id', placeId)
        .single()

      if (existing) return { skipped: true, place_id: placeId }

      // Fetch full details from Google Places
      const details = await getPlaceDetails(placeId)

      const name = details.name || 'Unknown venue'
      const address = details.formatted_address || ''

      // Extract city from address components
      const cityComponent = details.address_components?.find(c =>
        (c.types as string[]).includes('postal_town') || (c.types as string[]).includes('locality')
      )
      const city = cityComponent?.long_name || ''

      const postcodeComponent = details.address_components?.find(c =>
        (c.types as string[]).includes('postal_code')
      )
      const postcode = postcodeComponent?.long_name || ''

      const photoRef = details.photos?.[0]?.photo_reference || null
      const coverUrl = photoRef ? getPhotoUrl(photoRef) : null

      const category = detectCategory(details.types || [])
      const tagline = generateTagline(name, city, category)

      const { data: venue, error } = await supabaseAdmin
        .from('venues')
        .insert({
          google_place_id: placeId,
          name,
          address,
          city,
          postcode,
          phone: details.formatted_phone_number || null,
          website: details.website || null,
          google_rating: details.rating || null,
          google_photo_ref: photoRef,
          google_types: details.types || [],
          lat: details.geometry?.location.lat || null,
          lng: details.geometry?.location.lng || null,
          cover_url: coverUrl,
          category,
          tagline,
          status: 'pending',
          tier: 'freemium',
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Log the import event
      await supabaseAdmin.from('venue_events').insert({
        venue_id: venue.id,
        event_type: 'imported',
        metadata: { place_id: placeId, source: 'google_places' },
      })

      return { success: true, venue }
    })
  )

  const imported = results.filter(r => r.status === 'fulfilled' && (r.value as { success?: boolean }).success).length
  const skipped = results.filter(r => r.status === 'fulfilled' && (r.value as { skipped?: boolean }).skipped).length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ imported, skipped, failed })
}

function detectCategory(types: string[]): string {
  if (types.includes('bar')) return 'Bar'
  if (types.includes('cafe')) return 'Café'
  if (types.includes('restaurant')) return 'Restaurant'
  if (types.includes('night_club')) return 'Club'
  return 'Pub'
}
