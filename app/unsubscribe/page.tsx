'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

const GOLD = '#CC9901'

export default function UnsubscribePage() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUnsubscribe = async () => {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      setError('Something went wrong — please try again or email hello@tavloy.com')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tavloy-logo-gold.png" alt="TavLoy" className="h-9 w-auto mb-8" />

      <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
        {done ? (
          <>
            <CheckCircle className="mx-auto mb-3" size={36} style={{ color: GOLD }} />
            <h1 className="text-base font-semibold text-gray-900 mb-1">You&apos;re unsubscribed</h1>
            <p className="text-sm text-gray-500">
              {email} won&apos;t receive any further outreach emails from TavLoy.
            </p>
          </>
        ) : !email ? (
          <p className="text-sm text-gray-500">No email address was provided with this link.</p>
        ) : (
          <>
            <h1 className="text-base font-semibold text-gray-900 mb-2">Unsubscribe from TavLoy emails?</h1>
            <p className="text-sm text-gray-500 mb-5">{email}</p>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="w-full py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-50"
              style={{ backgroundColor: GOLD }}
            >
              {loading ? 'Unsubscribing…' : 'Unsubscribe me'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
