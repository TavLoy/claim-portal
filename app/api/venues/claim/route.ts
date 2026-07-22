import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/venues/claim?token=xxx — validate token, return venue data
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const { data: venue, error } = await supabaseAdmin
    .from('venues')
    .select('*')
    .eq('claim_token', token)
    .single()

  if (error || !venue) {
    return NextResponse.json({ error: 'Invalid claim link' }, { status: 404 })
  }

  if (venue.status === 'claimed') {
    return NextResponse.json({ error: 'This venue has already been claimed' }, { status: 409 })
  }

  if (new Date(venue.claim_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This claim link has expired — contact TavLoy for a new one' }, { status: 410 })
  }

  // Return safe subset (no internal fields)
  return NextResponse.json({
    venue: {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      phone: venue.phone,
      website: venue.website,
      email: venue.email,
      category: venue.category,
      tagline: venue.tagline,
      google_rating: venue.google_rating,
      cover_url: venue.cover_url,
      opening_hours: venue.opening_hours,
      amenities: venue.amenities,
      logo_url: venue.logo_url,
      tier: venue.tier,
    }
  })
}

// POST /api/venues/claim — complete the claim with onboarding data
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, email, name, phone, description, tagline, logo_url, opening_hours } = body

  if (!token || !email) {
    return NextResponse.json({ error: 'token and email required' }, { status: 400 })
  }

  const { data: venue, error } = await supabaseAdmin
    .from('venues')
    .select('*')
    .eq('claim_token', token)
    .single()

  if (error || !venue) {
    return NextResponse.json({ error: 'Invalid claim link' }, { status: 404 })
  }

  if (venue.status === 'claimed') {
    return NextResponse.json({ error: 'Already claimed' }, { status: 409 })
  }

  if (new Date(venue.claim_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Claim link expired' }, { status: 410 })
  }

  // Complete the claim
  const { error: updateError } = await supabaseAdmin
    .from('venues')
    .update({
      status: 'claimed',
      claimed_at: new Date().toISOString(),
      claimed_by_email: email,
      email,
      name: name || venue.name,
      phone: phone || venue.phone,
      description,
      tagline: tagline || venue.tagline,
      logo_url,
      opening_hours,
    })
    .eq('id', venue.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await supabaseAdmin.from('venue_events').insert({
    venue_id: venue.id,
    event_type: 'claimed',
    metadata: { claimed_by_email: email },
    actor_email: email,
  })

  return NextResponse.json({ success: true, venue_id: venue.id })
}
