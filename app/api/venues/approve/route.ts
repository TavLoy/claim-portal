import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const { venue_id, action } = await req.json()

  if (!venue_id || !action) {
    return NextResponse.json({ error: 'venue_id and action required' }, { status: 400 })
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  if (action === 'reject') {
    const { error } = await supabaseAdmin
      .from('venues')
      .update({ status: 'rejected' })
      .eq('id', venue_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin.from('venue_events').insert({
      venue_id,
      event_type: 'rejected',
    })

    return NextResponse.json({ success: true, status: 'rejected' })
  }

  // Generate a secure unique claim token
  const claimToken = nanoid(32)
  const expiryDays = parseInt(process.env.CLAIM_TOKEN_EXPIRY_DAYS || '30')
  const expiresAt = addDays(new Date(), expiryDays).toISOString()

  const { data: venue, error } = await supabaseAdmin
    .from('venues')
    .update({
      status: 'approved',
      claim_token: claimToken,
      claim_token_expires_at: expiresAt,
    })
    .eq('id', venue_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('venue_events').insert({
    venue_id,
    event_type: 'approved',
    metadata: { claim_token_expires_at: expiresAt },
  })

  return NextResponse.json({ success: true, venue })
}
