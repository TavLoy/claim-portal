'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Phone } from 'lucide-react'
import type { Venue } from '@/types'
import { getInitials } from '@/lib/client-utils'

interface Props {
  venue: Venue | null
  onApprove: (venue: Venue) => void
}

export default function PreviewTab({ venue: initialVenue, onApprove }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [tagline, setTagline] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (initialVenue) {
      setName(initialVenue.name)
      setAddress(initialVenue.address)
      setPhone(initialVenue.phone || '')
      setTagline(initialVenue.tagline || '')
      setCategory(initialVenue.category)
    }
  }, [initialVenue])

  if (!initialVenue) {
    return (
      <div className="text-sm text-gray-400 py-12 text-center">
        Select a venue from the Review queue to preview its listing.
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/venues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venue_id: initialVenue.id,
        name, address, phone, tagline, category,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleApprove = async () => {
    await handleSave()
    onApprove({ ...initialVenue, name, address, phone, tagline, category })
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left — editable NAP */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">NAP data</h2>

        {[
          { label: 'Venue name', value: name, onChange: setName },
          { label: 'Address', value: address, onChange: setAddress },
          { label: 'Phone', value: phone, onChange: setPhone },
          { label: 'Tagline', value: tagline, onChange: setTagline },
          { label: 'Category', value: category, onChange: setCategory },
        ].map(field => (
          <div key={field.label} className="space-y-1">
            <label className="text-xs text-gray-500">{field.label}</label>
            <input
              type="text"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Google rating</label>
          <input
            type="text"
            value={initialVenue.google_rating?.toString() || '—'}
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400"
          />
        </div>

        <p className="text-xs text-gray-400">
          Cover photo auto-selected from Google Places. Logo generated from initials until venue uploads their own.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Approve & continue →
          </button>
        </div>
      </div>

      {/* Right — listing preview card */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Listing preview</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-xs">
          {/* Cover image */}
          <div className="h-32 bg-gradient-to-br from-emerald-300 to-emerald-600 relative flex items-end">
            {initialVenue.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initialVenue.cover_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <span className="relative z-10 m-2 text-xs px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">
              Freemium
            </span>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Logo */}
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-semibold text-sm mb-3">
              {getInitials(name)}
            </div>

            <div className="font-semibold text-sm text-gray-900 mb-0.5">{name || '—'}</div>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin size={11} /> {address || '—'}
            </div>

            {phone && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Phone size={11} /> {phone}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              {initialVenue.google_rating && (
                <>
                  <Star size={11} className="text-amber-500" fill="currentColor" />
                  <span className="text-amber-700">{initialVenue.google_rating}</span>
                  <span>·</span>
                </>
              )}
              <span>{category}</span>
            </div>

            {tagline && (
              <p className="text-xs text-gray-400 italic">{tagline}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
