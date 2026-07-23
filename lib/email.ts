import { Resend } from 'resend'
import type { Venue } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

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
      subject: `${venue.name} is on TavLoy — claim your free listing`,
      html,
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
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
  const venueSlug = venue.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

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
    .header-logo { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 4px; }
    .header-logo span { color: #E8C158; }
    .header-sub { font-size: 13px; color: #d9c9a3; }
    .venue-banner { background: #CC9901; padding: 20px 32px; display: flex; align-items: center; gap: 16px; }
    .venue-initials { width: 48px; height: 48px; border-radius: 10px; background: #FDF6E3; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 600; color: #7a5c00; flex-shrink: 0; }
    .venue-details { color: #ffffff; }
    .venue-name { font-size: 17px; font-weight: 600; margin-bottom: 2px; }
    .venue-addr { font-size: 13px; opacity: 0.85; }
    .body { padding: 32px; }
    .body p { font-size: 15px; line-height: 1.6; color: #3d3d3a; margin: 0 0 16px; }
    .cta { display: block; text-align: center; background: #CC9901; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 24px 0; }
    .features { background: #FDF6E3; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #f0dfa0; }
    .features p { font-size: 13px; font-weight: 600; color: #7a5c00; margin: 0 0 10px; }
    .feature-item { font-size: 13px; color: #3d3d3a; margin: 0 0 6px; padding-left: 18px; position: relative; }
    .feature-item::before { content: "✓"; position: absolute; left: 0; color: #CC9901; font-weight: 600; }
    .footer { padding: 20px 32px; border-top: 1px solid #e8e8e4; }
    .footer p { font-size: 12px; color: #888780; margin: 0 0 4px; line-height: 1.5; }
    .footer a { color: #7a5c00; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${APP_URL}/tavloy-logo-white.png" alt="TavLoy" width="140" style="display:block;margin-bottom:6px;" />
      <div class="header-sub">Digital loyalty &amp; guest engagement</div>
    </div>

    <div class="venue-banner">
      <div class="venue-initials">${initials}</div>
      <div class="venue-details">
        <div class="venue-name">${venue.name}</div>
        <div class="venue-addr">${venue.address}</div>
      </div>
    </div>

    <div class="body">
      <p>Hi there,</p>
      <p>We've created a free listing for <strong>${venue.name}</strong> on TavLoy — the UK loyalty and guest engagement platform for pubs, bars, cafés and restaurants.</p>
      <p>Diners in your area are discovering venues on TavLoy right now. Claiming your listing takes under 5 minutes and it's completely free.</p>

      <div class="features">
        <p>Your free listing includes:</p>
        <div class="feature-item">Your venue profile on the TavLoy app</div>
        <div class="feature-item">Digital loyalty stamp card for your regulars</div>
        <div class="feature-item">Basic traffic dashboard (views, scans, taps)</div>
        <div class="feature-item">QR code to display at your venue</div>
      </div>

      <a href="${claimUrl}" class="cta" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;background:#CC9901;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin:24px 0;">Claim ${venue.name} →</a>

      <p style="font-size:13px;color:#888780;">This link expires in 30 days. Your listing is live at tavloy.com/venues/${venueSlug}. If you'd like it removed, just reply to this email and we'll take it down within 24 hours.</p>
    </div>

    <div class="footer">
      <p>TavLoy · Blackjack Media Ltd · United Kingdom</p>
      <p><a href="${APP_URL}/unsubscribe">Unsubscribe</a> · <a href="${APP_URL}/privacy">Privacy policy</a></p>
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
