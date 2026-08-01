import type { Config } from '@netlify/functions'
import { runReminderPass } from '../../lib/reminders'

// Runs once daily. Checks every approved-but-unclaimed venue and sends
// whichever reminder (1st/2nd/3rd) is due based on days elapsed since the
// original claim email — see lib/reminders.ts for the actual logic, which
// is shared with the manual /api/venues/send-reminders trigger.
export default async () => {
  const result = await runReminderPass()
  console.log('[send-reminders-scheduled]', JSON.stringify(result))
}

export const config: Config = {
  schedule: '0 9 * * *', // 9am UTC daily
}
