import { Client } from '@googlemaps/google-maps-services-js'
import type { PlaceResult } from '@/types'
import { supabaseAdmin } from './supabase'

const client = new Client({})
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

const HOSPITALITY_TYPES = [
  'bar', 'cafe', 'restaurant', 'food', 'pub',
  'night_club', 'meal_takeaway', 'meal_delivery'
]

export async function searchPlaces(
  location: string,
  type: string,
  radiusKm: number,
  venueName?: string
): Promise<PlaceResult[]> {
  // Geocode the location string to lat/lng
  const geoRes = await client.geocode({
    params: { address: location, key: API_KEY }
  })

  if (!geoRes.data.results.length) {
    throw new Error(`Could not geocode location: ${location}`)
  }

  const { lat, lng } = geoRes.data.results[0].geometry.location

  // If a specific venue name is given, search by name directly rather than
  // by category — lets Mani target a known venue that a category+location
  // search might not have surfaced.
  const query = venueName ? `${venueName} ${location}` : `${type} near ${location}`

  // Text search for venues
  const searchRes = await client.textSearch({
    params: {
      query,
      location: { lat, lng },
      radius: radiusKm * 1000,
      // Don't constrain by Google's place `type` when searching by name —
      // a hotel bar, for instance, might not be typed exactly as expected.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(venueName ? {} : { type: mapVenueType(type) as any }),
      key: API_KEY,
    }
  })

  // Get already-imported place IDs to flag them
  const placeIds = searchRes.data.results
    .map(r => r.place_id)
    .filter(Boolean) as string[]

  const { data: existing } = await supabaseAdmin
    .from('venues')
    .select('google_place_id')
    .in('google_place_id', placeIds)

  const importedIds = new Set((existing || []).map(v => v.google_place_id))

  return searchRes.data.results
    .filter(r => r.place_id && r.name && r.formatted_address)
    .map(r => ({
      place_id: r.place_id!,
      name: r.name!,
      address: r.formatted_address!,
      rating: r.rating,
      photo_ref: r.photos?.[0]?.photo_reference,
      types: r.types || [],
      lat: r.geometry?.location.lat || 0,
      lng: r.geometry?.location.lng || 0,
      already_imported: importedIds.has(r.place_id!),
    }))
}

export async function getPlaceDetails(placeId: string) {
  const res = await client.placeDetails({
    params: {
      place_id: placeId,
      fields: ['name', 'formatted_address', 'formatted_phone_number',
               'website', 'rating', 'photos', 'types',
               'address_components', 'geometry', 'opening_hours'],
      key: API_KEY,
    }
  })
  return res.data.result
}

export function getPhotoUrl(photoRef: string, maxWidth = 800): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${API_KEY}`
}

export function generateTagline(name: string, city: string, category: string): string {
  const templates = [
    `A well-loved ${category.toLowerCase()} in the heart of ${city}`,
    `Your local ${category.toLowerCase()} in ${city}`,
    `${name} — a great spot in ${city}`,
    `A popular ${category.toLowerCase()} serving ${city}`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase()
}

function mapVenueType(type: string): string {
  const map: Record<string, string> = {
    pub: 'bar',
    bar: 'bar',
    café: 'cafe',
    cafe: 'cafe',
    restaurant: 'restaurant',
    hotel: 'lodging',
  }
  return map[type.toLowerCase()] || 'bar'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapGoogleOpeningHours(googleHours: any): Record<string, { open: string; close: string; closed?: boolean }> | null {
  const periods = googleHours?.periods
  if (!Array.isArray(periods) || periods.length === 0) return null

  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const toHHMM = (t: string) => `${t.slice(0, 2)}:${t.slice(2, 4)}`

  const result: Record<string, { open: string; close: string; closed?: boolean }> = {}
  // Default every day to closed, then fill in from Google's periods
  for (const key of DAY_KEYS) {
    result[key] = { open: '', close: '', closed: true }
  }

  for (const period of periods) {
    const openDay = period.open?.day
    const openTime = period.open?.time
    if (openDay === undefined || !openTime) continue

    const dayKey = DAY_KEYS[openDay]

    // A period with no `close` means open 24 hours that day
    if (!period.close) {
      result[dayKey] = { open: '00:00', close: '23:59', closed: false }
      continue
    }

    result[dayKey] = {
      open: toHHMM(openTime),
      close: toHHMM(period.close.time),
      closed: false,
    }
  }

  return result
}
