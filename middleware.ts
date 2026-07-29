import { NextRequest, NextResponse } from 'next/server'

/**
 * Protects the internal admin portal (search, review queue, approve, send)
 * behind a simple username/password gate. Deliberately does NOT protect:
 *   - /claim/[token]        — public, venues need this to claim their listing
 *   - /unsubscribe          — public, venues need this to opt out
 *   - /api/venues/claim     — public, powers the claim page above
 *   - /api/unsubscribe      — public, powers the unsubscribe page above
 *   - /api/static-map       — loaded as an <img> src from the public claim
 *                             page too; a browser image request can't supply
 *                             Basic Auth credentials, so this must stay open
 *
 * Credentials come from PORTAL_USERNAME / PORTAL_PASSWORD env vars — set
 * those in Netlify (mark PORTAL_PASSWORD as "Contains secret values").
 */
export function middleware(req: NextRequest) {
  const user = process.env.PORTAL_USERNAME
  const pass = process.env.PORTAL_PASSWORD

  // If credentials aren't configured yet, fail closed (block) rather than
  // silently leaving the portal open — safer default while you're setting
  // this up than accidentally shipping with no protection.
  if (!user || !pass) {
    return new NextResponse('Portal auth is not configured. Set PORTAL_USERNAME and PORTAL_PASSWORD.', { status: 500 })
  }

  const authHeader = req.headers.get('authorization')

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const [suppliedUser, suppliedPass] = decoded.split(':')
      if (suppliedUser === user && suppliedPass === pass) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="TavLoy Admin Portal"' },
  })
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/api/places/:path*',
    '/api/venues',
    '/api/venues/import',
    '/api/venues/approve',
    '/api/venues/send-claim',
  ],
}
