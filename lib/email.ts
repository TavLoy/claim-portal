import { Resend } from 'resend'
import type { Venue } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
const INTERNAL_NOTIFY_EMAIL = 'msharma@blackjackmedia.co.uk'

export async function sendClaimEmail(venue: Venue): Promise<{ success: boolean; error?: string }> {
  if (!venue.email) {
    return { success: false, error: 'No email address for this venue' }
  }

  if (!venue.claim_token) {
    return { success: false, error: 'No claim token generated yet' }
  }

  const claimUrl = `${APP_URL}/claim/${venue.claim_token}`
  const initials = getInitials(venue.name)

  const html = buildClaimEmailHtml({ venue, claimUrl, initials })

  try {
    await resend.emails.send({
      from: FROM,
      to: venue.email,
      subject: 'Get discovered on TavLoy — claim your free listing',
      html,
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/** Internal notification fired to the team whenever a venue completes a claim,
 *  so there's a record of when consent to be featured was given. */
export async function sendClaimNotification(venue: Venue, claimedByEmail: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: INTERNAL_NOTIFY_EMAIL,
      subject: `✅ Venue claimed: ${venue.name}`,
      html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;padding:24px;color:#1a1208;">
  <h2 style="margin:0 0 16px;">${venue.name} has been claimed</h2>
  <table cellpadding="6" style="border-collapse:collapse;font-size:14px;">
    <tr><td style="color:#7a5c00;font-weight:600;">Venue</td><td>${venue.name}</td></tr>
    <tr><td style="color:#7a5c00;font-weight:600;">Address</td><td>${venue.address}</td></tr>
    <tr><td style="color:#7a5c00;font-weight:600;">Claimed by</td><td>${claimedByEmail}</td></tr>
    <tr><td style="color:#7a5c00;font-weight:600;">Claimed at</td><td>${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td></tr>
    <tr><td style="color:#7a5c00;font-weight:600;">Venue ID</td><td style="font-family:monospace;font-size:12px;">${venue.id}</td></tr>
  </table>
  <p style="font-size:13px;color:#888780;margin-top:20px;">Consent to feature this business on the TavLoy app was recorded at the point of claim.</p>
</body>
</html>`,
    })
  } catch (err) {
    // Non-fatal — the claim itself already succeeded; just log it
    console.error('[sendClaimNotification] failed:', err)
  }
}

function buildClaimEmailHtml({
  venue,
  claimUrl,
  initials,
}: {
  venue: Venue
  claimUrl: string
  initials: string
}): string {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(venue.email || '')}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claim your TavLoy listing</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #1a1208; padding: 28px 32px; }
    .header-sub { font-size: 12.5px; color: #d9c9a3; line-height: 1.5; margin-top: 10px; }
    .body { padding: 32px; }
    .body p { font-size: 15px; line-height: 1.6; color: #3d3d3a; margin: 0 0 16px; }
    .features { background: #FDF6E3; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #f0dfa0; }
    .features p { font-size: 13px; font-weight: 600; color: #7a5c00; margin: 0 0 10px; }
    .feature-item { font-size: 13px; color: #3d3d3a; margin: 0 0 6px; }
    .disclaimer { font-size: 12px; color: #7a5c00; background: #FDF6E3; border-radius: 8px; padding: 12px 16px; margin: 20px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #e8e8e4; }
    .footer p { font-size: 12px; color: #888780; margin: 0 0 4px; line-height: 1.5; }
    .footer a { color: #7a5c00; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${APP_URL}/tavloy-logo-white.png" alt="TavLoy" width="140" style="display:block;" />
      <div class="header-sub">AI powered digital engagement platform built for pubs, bars, cafes, restaurants, hotels and music venues.</div>
    </div>

    <!-- Venue banner — table layout for reliable spacing across mail clients -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#CC9901;">
      <tr>
        <td style="padding:20px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:48px;height:48px;background:#FDF6E3;border-radius:10px;text-align:center;vertical-align:middle;font-size:17px;font-weight:600;color:#7a5c00;font-family:-apple-system,sans-serif;">
                ${initials}
              </td>
              <td style="width:16px;">&nbsp;</td>
              <td style="color:#ffffff;vertical-align:middle;">
                <div style="font-size:17px;font-weight:600;margin-bottom:2px;">${venue.name}</div>
                <div style="font-size:13px;opacity:0.85;">${venue.address}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="body">
      <p><strong>Put ${venue.name} in front of customers looking for their next favourite venue.</strong></p>
      <p>TavLoy is changing the way people discover and engage with pubs, bars, cafés, restaurants, hotels and clubs across the UK. By claiming your FREE venue profile, you'll increase your visibility, attract new customers and give existing customers more reasons to come back.</p>
      <p><strong>Is ${venue.name} listed yet?</strong></p>
      <p>Early adopters are already building their presence on TavLoy, growing followers and getting discovered first. Every day you wait is another opportunity for nearby venues to get ahead.</p>
      <p>Customers are already discovering venues on TavLoy. Don't let yours be the one they miss. Thousands of people will decide where to eat, drink and stay next. Make sure they find your venue first.</p>
      <p>Claiming your venue takes less than 5 minutes and is completely FREE.</p>

      <div class="features">
        <p>Your free listing includes:</p>
        <div class="feature-item"><span style="color:#16A34A;font-weight:700;">✓</span>&nbsp;Your venue profile on the TavLoy app</div>
        <div class="feature-item"><span style="color:#16A34A;font-weight:700;">✓</span>&nbsp;Basic traffic dashboard (views &amp; clicks)</div>
        <div class="feature-item"><span style="color:#16A34A;font-weight:700;">✓</span>&nbsp;Google Maps Integration</div>
      </div>

      <p style="text-align:center;font-weight:600;color:#1a1208;">Claim your FREE listing today.</p>

      <!-- Bulletproof button: table + solid background cell, works across Outlook/Hotmail -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
        <tr>
          <td style="border-radius:8px;background-color:#CC9901;" align="center">
            <a href="${claimUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Claim ${venue.name} →</a>
          </td>
        </tr>
      </table>
      <p style="font-size:12px;color:#a8a79f;text-align:center;margin-top:-8px;">
        Button not working? Paste this link into your browser:<br />
        <a href="${claimUrl}" style="color:#7a5c00;word-break:break-all;">${claimUrl}</a>
      </p>

      <div class="disclaimer">
        By claiming your listing, you are consenting to featuring your business on the TavLoy mobile app.
      </div>

      <p style="font-size:13px;color:#888780;">This link expires in 30 days. Your listing will not appear in the live app unless you claim it. If you do not want to participate, then no action is required.</p>
    </div>

    <div class="footer">
      <p>TavLoy · United Kingdom</p>
      <p><a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="https://www.tavloy.com/privacy-policy/">Privacy policy</a></p>
    </div>
  </div>
</body>
</html>`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase()
}
