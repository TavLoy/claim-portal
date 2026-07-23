'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import type { Venue } from '@/types'
import { getInitials } from '@/lib/client-utils'

interface Props {
  venue: Venue | null
}

export default function SendClaimTab({ venue }: Props) {
  const [email, setEmail] = useState(venue?.email || '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!venue) {
    return (
      <div className="text-sm text-gray-400 py-12 text-center">
        Select an approved venue from the Review queue first.
      </div>
    )
  }

  if (venue.status === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        This venue is still pending. Go back to the Review queue and approve it first.
      </div>
    )
  }

  const handleSend = async () => {
    if (!email.trim()) { setError('Enter an email address'); return }
    setSending(true); setError('')

    const res = await fetch('/api/venues/send-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_id: venue.id, override_email: email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Send failed')
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
  }

  const venueSlug = venue.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tavloy.com'}/claim/${venue.claim_token}`

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Email preview */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Email preview</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
          {/* Header */}
          <div className="bg-[#1a1208] px-5 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tavloy-logo-white.png" alt="TavLoy" className="h-6 w-auto mb-1" />
            <div className="text-gold-300 text-xs mt-0.5">Digital loyalty & guest engagement</div>
          </div>

          {/* Venue banner */}
          <div className="bg-gold-600 px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center text-gold-800 font-semibold text-sm flex-shrink-0">
              {getInitials(venue.name)}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{venue.name}</div>
              <div className="text-gold-200 text-xs">{venue.address}</div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-gray-600 leading-relaxed">Hi there,</p>
            <p className="text-gray-600 leading-relaxed">
              We've created a free listing for <strong>{venue.name}</strong> on TavLoy — the UK loyalty and guest engagement platform for pubs, bars, cafés and restaurants.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gold-800">Your free listing includes:</p>
              {['Venue profile on the TavLoy app', 'Digital loyalty stamp card', 'Basic traffic dashboard', 'QR code for your venue'].map(f => (
                <div key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="text-gold-600 font-bold">✓</span> {f}
                </div>
              ))}
            </div>

            <div className="bg-gold-600 text-white text-center py-2.5 rounded-lg text-sm font-medium">
              Claim {venue.name} →
            </div>

            <p className="text-xs text-gray-400">
              Link expires in 30 days. Your listing is live at tavloy.com/venues/{venueSlug}.
            </p>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            TavLoy · Blackjack Media Ltd · Unsubscribe
          </div>
        </div>
      </div>

      {/* Send controls */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Send details</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">To (venue contact email)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="info@thevenue.co.uk"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            {!venue.email && (
              <p className="text-xs text-amber-600">No email from Google Places — enter manually above.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">From</label>
            <input type="text" value="John at TavLoy" disabled className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400" />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="text-xs font-medium text-gray-700">Listing status</div>
            <div className="text-xs text-gray-600">
              {venue.name} ·{' '}
              <span className={`font-medium ${venue.status === 'approved' ? 'text-gold-700' : 'text-purple-700'}`}>
                {venue.status}
              </span>
            </div>
            {venue.claim_token_expires_at && (
              <div className="text-xs text-gray-500">
                Token expires {new Date(venue.claim_token_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
            {venue.claim_token && (
              <div className="text-xs text-gray-400 font-mono truncate">{claimUrl}</div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          {sent ? (
            <div className="flex items-center gap-2 text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2 text-sm">
              <CheckCircle size={15} /> Sent to {email}
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || venue.status === 'claimed'}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail size={14} />
              {sending ? 'Sending…' : venue.status === 'claimed' ? 'Already claimed' : 'Send claim email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
