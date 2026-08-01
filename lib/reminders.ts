import { supabaseAdmin } from './supabase'
import { sendReminderEmail } from './email'
import type { Venue } from '../types'

const THRESHOLDS_DAYS = [3, 7, 14] // day offsets from claim_sent_at for reminders 1, 2, 3

function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

export interface ReminderRunResult {
  checked: number
  sent: number
  skipped: number
  errors: { venue_id: string; error: string }[]
}

/** Finds every approved-but-unclaimed venue, works out whether it's due for
 *  its next reminder based on days elapsed since the original claim email,
 *  and sends it — skipping anyone unsubscribed, and never going past 3. */
export async function runReminderPass(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = { checked: 0, sent: 0, skipped: 0, errors: [] }

  const { data: venues, error } = await supabaseAdmin
    .from('venues')
    .select('*')
    .eq('status', 'approved')
    .is('claimed_at', null)
    .not('claim_sent_at', 'is', null)
    .lt('reminder_count', 3)

  if (error || !venues) {
    result.errors.push({ venue_id: 'n/a', error: error?.message || 'Failed to fetch venues' })
    return result
  }

  result.checked = venues.length

  for (const venue of venues as Venue[]) {
    const reminderCount = venue.reminder_count ?? 0
    const nextReminder = (reminderCount + 1) as 1 | 2 | 3

    if (nextReminder > 3 || !venue.claim_sent_at) {
      result.skipped++
      continue
    }

    const elapsed = daysSince(venue.claim_sent_at)
    const threshold = THRESHOLDS_DAYS[nextReminder - 1]

    if (elapsed < threshold) {
      result.skipped++
      continue
    }

    if (!venue.email) {
      result.skipped++
      continue
    }

    // Respect unsubscribes — never send a reminder to a suppressed address
    const { data: suppressed } = await supabaseAdmin
      .from('email_suppressions')
      .select('email')
      .eq('email', venue.email.toLowerCase().trim())
      .maybeSingle()

    if (suppressed) {
      result.skipped++
      continue
    }

    const sendResult = await sendReminderEmail(venue, nextReminder)

    if (!sendResult.success) {
      result.errors.push({ venue_id: venue.id, error: sendResult.error || 'Unknown error' })
      continue
    }

    await supabaseAdmin
      .from('venues')
      .update({ reminder_count: nextReminder })
      .eq('id', venue.id)

    // Reuses the existing 'claim_sent' event type (metadata distinguishes
    // reminders from the original send) rather than requiring a Postgres
    // enum migration just for logging.
    await supabaseAdmin.from('venue_events').insert({
      venue_id: venue.id,
      event_type: 'claim_sent',
      metadata: { reminder_number: nextReminder, automated: true },
    })

    result.sent++
  }

  return result
}
