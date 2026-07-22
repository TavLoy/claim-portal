'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Star, MapPin } from 'lucide-react'
import { getInitials } from '@/lib/client-utils'
import type { OpeningHours } from '@/types'

type Step = 'loading' | 'error' | 'confirm' | 'done'

const GOLD = '#CC9901'
const GOLD_DARK = '#7a5c00'
const GOLD_BG = '#FDF6E3'

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const todayKey = (): keyof OpeningHours => {
  const idx = new Date().getDay()
  const map: (keyof OpeningHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return map[idx]
}

interface VenueData {
  id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  category: string
  tagline: string | null
  google_rating: number | null
  cover_url: string | null
  logo_url?: string | null
  amenities?: string[] | null
  opening_hours?: OpeningHours | null
  tier?: string
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()

  const [step, setStep] = useState<Step>('loading')
  const [venue, setVenue] = useState<VenueData | null>(null)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/venues/claim?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setStep('error'); return }
        setVenue(data.venue)
        setName(data.venue.name)
        setPhone(data.venue.phone || '')
        setEmail(data.venue.email || '')
        setStep('confirm')
      })
      .catch(() => { setError('Something went wrong. Please try again.'); setStep('error') })
  }, [token])

  const handleClaim = async () => {
    if (!email.trim()) { return }
    setSubmitting(true)

    const res = await fetch('/api/venues/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, name, phone, description }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setStep('done')
  }

  if (step === 'loading') {
    return <ClaimShell><div className="text-sm text-gray-400 py-12 text-center">Checking your link…</div></ClaimShell>
  }

  if (step === 'error') {
    return (
      <ClaimShell>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 font-medium mb-2">This link isn&apos;t valid</div>
          <div className="text-sm text-red-500">{error}</div>
          <p className="text-xs text-gray-400 mt-4">
            Email <a href="mailto:hello@tavloy.com" className="underline" style={{ color: GOLD }}>hello@tavloy.com</a> and we&apos;ll send you a fresh link.
          </p>
        </div>
      </ClaimShell>
    )
  }

  if (step === 'done') {
    return (
      <ClaimShell>
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-3 pt-2">
            <CheckCircle className="mx-auto" size={44} style={{ color: GOLD }} />
            <h1 className="text-xl font-semibold text-gray-900">You&apos;re on TavLoy!</h1>
            <p className="text-gray-500 text-sm">
              {venue?.name} is now live on the TavLoy app. You&apos;ll get an email with your dashboard link within 24 hours.
            </p>
          </div>

          {venue && <ListingCard venue={venue} tierFreemium={venue.tier !== 'starter' && venue.tier !== 'growth' && venue.tier !== 'enterprise'} />}

          <div
            className="rounded-xl p-4 text-sm space-y-1.5 border"
            style={{ backgroundColor: GOLD_BG, borderColor: GOLD, color: GOLD_DARK }}
          >
            <div className="font-medium mb-1">What happens next:</div>
            {[
              'Your listing goes live on the TavLoy app',
              "You'll receive your QR code by email",
              'Your traffic dashboard will be ready within 24 hours',
              "We'll be in touch about upgrading to unlock Order at Table",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="font-bold mt-0.5" style={{ color: GOLD }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </ClaimShell>
    )
  }

  return (
    <ClaimShell>
      <div className="max-w-md mx-auto space-y-6">
        {venue && <ListingCard venue={venue} tierFreemium={venue.tier !== 'starter' && venue.tier !== 'growth' && venue.tier !== 'enterprise'} />}

        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-gray-900">Claim your listing</h1>
          <p className="text-sm text-gray-500">Confirm your details below. It takes under 5 minutes.</p>

          <div className="space-y-3">
            <Field label="Your email (for dashboard access)" required>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@thevenue.co.uk"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ ['--tw-ring-color' as string]: GOLD }}
              />
            </Field>

            <Field label="Venue name">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ ['--tw-ring-color' as string]: GOLD }}
              />
            </Field>

            <Field label="Phone number">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01234 567890"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ ['--tw-ring-color' as string]: GOLD }}
              />
            </Field>

            <Field label="Tell us about your venue (optional)">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A classic local boozer with great food and a beer garden…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                style={{ ['--tw-ring-color' as string]: GOLD }}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleClaim}
            disabled={submitting || !email.trim()}
            className="w-full py-3 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: GOLD }}
          >
            {submitting ? 'Claiming…' : `Claim ${venue?.name || 'your venue'} →`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            It&apos;s free. No card needed. You can delete your listing any time.
          </p>
        </div>
      </div>
    </ClaimShell>
  )
}

/** Shared read-only listing card — keep this visually identical to the admin
 *  Listing Preview tab so a claimed venue's page always matches what was
 *  shown internally before approval. */
function ListingCard({ venue, tierFreemium }: { venue: VenueData; tierFreemium?: boolean }) {
  const today = todayKey()
  const amenities = venue.amenities || []
  const hours = venue.opening_hours

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="relative h-28 bg-gray-900 rounded-b-[36px] overflow-hidden">
        {venue.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
      </div>

      <div className="p-4 space-y-3">
        {tierFreemium && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 border text-xs"
            style={{ backgroundColor: GOLD_BG, borderColor: GOLD, color: GOLD_DARK }}
          >
            Earn rewards not currently available at this venue
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-gray-900 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden">
            {venue.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={venue.logo_url} alt="" className="w-full h-full object-contain bg-white" />
            ) : (
              getInitials(venue.name)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: GOLD }}>{venue.name}</div>
            <span
              className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: GOLD_BG, color: GOLD_DARK }}
            >
              {venue.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin size={12} style={{ color: GOLD }} className="flex-shrink-0" />
          <span className="truncate">{venue.address}</span>
        </div>

        {venue.google_rating && (
          <div className="flex items-center gap-1 text-xs">
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <span style={{ color: GOLD_DARK }} className="font-medium">{venue.google_rating}</span>
          </div>
        )}

        {venue.tagline && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 leading-relaxed">{venue.tagline}</p>
          </div>
        )}

        {/* We offer */}
        {amenities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-gray-900">We offer</div>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map(a => (
                <span key={a} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Opening hours */}
        {hours && (
          <div className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: GOLD_BG, borderColor: '#f0dfa0' }}>
            <div className="text-xs font-semibold mb-1.5" style={{ color: GOLD }}>Opening Hours</div>
            <div className="bg-white rounded-lg p-2.5 space-y-0.5">
              {DAYS.map(({ key, label }) => {
                const dh = hours[key]
                if (!dh) return null
                const isToday = key === today
                return (
                  <div key={key} className="flex justify-between text-[11px] py-0.5" style={{ borderTop: '0.5px solid #f5f5f0' }}>
                    <span className={isToday ? 'font-semibold' : 'text-gray-500'} style={isToday ? { color: GOLD } : {}}>{label}</span>
                    <span
                      className={dh.closed ? 'text-gray-300' : isToday ? 'font-semibold' : 'text-gray-800'}
                      style={isToday && !dh.closed ? { color: GOLD } : {}}
                    >
                      {dh.closed ? 'Closed' : `${dh.open} - ${dh.close}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClaimShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <span className="font-semibold text-gray-900">
          Tav<span style={{ color: GOLD }}>Loy</span>
        </span>
      </nav>
      <div className="flex-1 px-4 py-8">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
