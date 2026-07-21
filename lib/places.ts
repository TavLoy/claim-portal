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
  radiusKm: number
): Promise<PlaceResult[]> {
  // Geocode the location string to lat/lng
  const geoRes = await client.geocode({
    params: { address: location, key: API_KEY }
  })

  if (!geoRes.data.results.length) {
    throw new Error(`Could not geocode location: ${location}`)
  }

  const { lat, lng } = geoRes.data.results[0].geometry.location

  // Text search for venues
  const searchRes = await client.textSearch({
    params: {
      query: `${type} near ${location}`,
      location: { lat, lng },
      radius: radiusKm * 1000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: mapVenueType(type) as any,
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
  }
  return map[type.toLowerCase()] || 'bar'
}
