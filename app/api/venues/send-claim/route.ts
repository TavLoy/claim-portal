import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendClaimEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { venue_id, override_email } = await req.json()

  if (!venue_id) {
    return NextResponse.json({ error: 'venue_id required' }, { status: 400 })
  }

  // Fetch the venue
  const { data: venue, error: fetchError } = await supabaseAdmin
    .from('venues')
    .select('*')
    .eq('id', venue_id)
    .single()

  if (fetchError || !venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }

  if (venue.status !== 'approved') {
    return NextResponse.json(
      { error: `Venue must be approved before sending claim email (current: ${venue.status})` },
      { status: 400 }
    )
  }

  if (!venue.claim_token) {
    return NextResponse.json({ error: 'No claim token — approve the venue first' }, { status: 400 })
  }

  // Allow overriding the email (e.g. if Google Places email is missing)
  const emailToUse = override_email || venue.email
  if (!emailToUse) {
    return NextResponse.json(
      { error: 'No email address — provide override_email in request body' },
      { status: 400 }
    )
  }

  // Update venue email if override provided
  if (override_email && override_email !== venue.email) {
    await supabaseAdmin
      .from('venues')
      .update({ email: override_email })
      .eq('id', venue_id)
  }

  const result = await sendClaimEmail({ ...venue, email: emailToUse })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Mark claim as sent
  await supabaseAdmin
    .from('venues')
    .update({ claim_sent_at: new Date().toISOString() })
    .eq('id', venue_id)

  await supabaseAdmin.from('venue_events').insert({
    venue_id,
    event_type: 'claim_sent',
    metadata: { email: emailToUse },
  })

  return NextResponse.json({ success: true, sent_to: emailToUse })
}
