import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { VenueStatus } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as VenueStatus | null
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('venues')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: venues, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get stats across all statuses
  const { data: statsData } = await supabaseAdmin
    .from('venues')
    .select('status')
    .is('deleted_at', null)

  const stats = {
    total: statsData?.length || 0,
    pending: statsData?.filter(v => v.status === 'pending').length || 0,
    approved: statsData?.filter(v => v.status === 'approved').length || 0,
    claimed: statsData?.filter(v => v.status === 'claimed').length || 0,
    rejected: statsData?.filter(v => v.status === 'rejected').length || 0,
  }

  return NextResponse.json({ venues, stats, total: count, page, limit })
}

// PATCH /api/venues — update NAP data
export async function PATCH(req: NextRequest) {
  const { venue_id, ...updates } = await req.json()

  if (!venue_id) {
    return NextResponse.json({ error: 'venue_id required' }, { status: 400 })
  }

  // Whitelist editable fields
  const allowed = ['name', 'address', 'phone', 'email', 'website', 'tagline', 'category', 'description']
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabaseAdmin
    .from('venues')
    .update(safeUpdates)
    .eq('id', venue_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, venue: data })
}
