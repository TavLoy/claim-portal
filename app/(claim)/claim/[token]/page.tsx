'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, Star, MapPin } from 'lucide-react'
import { getInitials } from '@/lib/client-utils'

type Step = 'loading' | 'error' | 'confirm' | 'profile' | 'hours' | 'done'

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
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [step, setStep] = useState<Step>('loading')
  const [venue, setVenue] = useState<VenueData | null>(null)
  const [error, setError] = useState('')

  // Form state
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
          <div className="text-red-600 font-medium mb-2">This link isn't valid</div>
          <div className="text-sm text-red-500">{error}</div>
          <p className="text-xs text-gray-400 mt-4">Email <a href="mailto:hello@tavloy.com" className="text-emerald-600 underline">hello@tavloy.com</a> and we'll send you a fresh link.</p>
        </div>
      </ClaimShell>
    )
  }

  if (step === 'done') {
    return (
      <ClaimShell>
        <div className="text-center py-8 space-y-4">
          <CheckCircle className="mx-auto text-emerald-500" size={48} />
          <h1 className="text-xl font-semibold">You're on TavLoy!</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {venue?.name} is now live on the TavLoy app. You'll get an email with your dashboard link within 24 hours.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 max-w-sm mx-auto space-y-1.5">
            <div className="font-medium mb-2">What happens next:</div>
            {[
              "Your listing goes live on the TavLoy app",
              "You'll receive your QR code by email",
              "Your traffic dashboard will be ready within 24 hours",
              "We'll be in touch about upgrading to unlock Order at Table",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
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
        {/* Venue card */}
        {venue && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-emerald-400 to-emerald-700 relative">
              {venue.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-semibold text-sm flex-shrink-0 -mt-8 border-2 border-white">
                {getInitials(venue.name)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{venue.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {venue.address}
                </div>
                {venue.google_rating && (
                  <div className="flex items-center gap-1 text-xs text-amber-700 mt-0.5">
                    <Star size={11} fill="currentColor" /> {venue.google_rating}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Claim your listing</h1>
          <p className="text-sm text-gray-500">Confirm your details below. It takes under 5 minutes.</p>

          <div className="space-y-3">
            <Field label="Your email (for dashboard access)" required>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@thevenue.co.uk"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>

            <Field label="Venue name">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>

            <Field label="Phone number">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01234 567890"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>

            <Field label="Tell us about your venue (optional)">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A classic local boozer with great food and a beer garden…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleClaim}
            disabled={submitting || !email.trim()}
            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Claiming…' : `Claim ${venue?.name || 'your venue'} →`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            It's free. No card needed. You can delete your listing any time.
          </p>
        </div>
      </div>
    </ClaimShell>
  )
}

function ClaimShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <span className="font-semibold text-gray-900">
          Tav<span className="text-emerald-600">Loy</span>
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
