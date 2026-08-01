import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildReminderEmailHtml } from '@/lib/email'
import type { Venue } from '@/types'

// Renders a reminder email's HTML directly in the browser for previewing —
// never sends anything. Pass ?n=1|2|3 for which reminder, and optionally
// ?venue_id=<uuid> to preview with a real venue's data; without it, a
// sample venue is used instead.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const n = parseInt(searchParams.get('n') || '1')
  const venueId = searchParams.get('venue_id')

  if (![1, 2, 3].includes(n)) {
    return NextResponse.json({ error: 'n must be 1, 2, or 3' }, { status: 400 })
  }

  let venue: Venue

  if (venueId) {
    const { data, error } = await supabaseAdmin.from('venues').select('*').eq('id', venueId).single()
    if (error || !data) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }
    venue = data as Venue
    // Ensure there's something to build a claim link with even if this
    // particular venue was never actually sent one yet
    if (!venue.claim_token) venue.claim_token = 'preview-token'
  } else {
    venue = {
      id: 'preview',
      name: 'The Sample Arms',
      email: 'owner@example.com',
      claim_token: 'preview-token',
    } as Venue
  }

  const { html } = buildReminderEmailHtml(venue, n as 1 | 2 | 3)

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
