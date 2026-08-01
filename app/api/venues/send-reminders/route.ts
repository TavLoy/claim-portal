import { NextResponse } from 'next/server'
import { runReminderPass } from '@/lib/reminders'

// Manual trigger for the same reminder logic the scheduled function runs
// daily — lets you test it on demand, or re-run it by hand if the schedule
// ever needs debugging. Protected by middleware like the rest of /api/venues.
export async function POST() {
  const result = await runReminderPass()
  return NextResponse.json(result)
}
