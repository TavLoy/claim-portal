
'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Phone, Mail, Globe, ChevronLeft, Info } from 'lucide-react'
import type { Venue } from '@/types'
import { getInitials } from '@/lib/client-utils'

interface Props {
  venue: Venue | null
  onApprove: (venue: Venue) => void
}

const GOLD = '#CC9901'
const GOLD_DARK = '#7a5c00'
const GOLD_BG = '#FDF6E3'

export default function PreviewTab({ venue: initialVenue, onApprove }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [tagline, setTagline] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (initialVenue) {
      setName(initialVenue.name)
      setAddress(initialVenue.address)
      setPhone(initialVenue.phone || '')
      setEmail(initialVenue.email || '')
      setWebsite(initialVenue.website || '')
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
        name, address, phone, email, website, tagline, category,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleApprove = async () => {
    await handleSave()
    onApprove({ ...initialVenue, name, address, phone, email, website, tagline, category })
  }

  const isFreemium = initialVenue.tier === 'freemium'

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left — editable NAP */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">NAP data</h2>

        {[
          { label: 'Venue name', value: name, onChange: setName },
          { label: 'Address', value: address, onChange: setAddress },
          { label: 'Phone', value: phone, onChange: setPhone },
          { label: 'Email', value: email, onChange: setEmail },
          { label: 'Website', value: website, onChange: setWebsite },
          { label: 'Tagline', value: tagline, onChange: setTagline },
          { label: 'Category', value: category, onChange: setCategory },
        ].map(field => (
          <div key={field.label} className="space-y-1">
            <label className="text-xs text-gray-500">{field.label}</label>
            <input
              type="text"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9901] focus:border-transparent"
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
            className="flex-1 py-2 text-sm text-white rounded-lg transition-colors font-medium"
            style={{ backgroundColor: GOLD }}
          >
            Approve & continue →
          </button>
        </div>
      </div>

      {/* Right — listing preview card, TavLoy gold theme */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Listing preview</h2>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-w-xs mx-auto">

          {/* Header photo with deep curve cutout */}
          <div className="relative h-40 bg-gray-900 overflow-hidden rounded-b-[48px]">
            {initialVenue.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initialVenue.cover_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
            <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center">
              <ChevronLeft size={15} className="text-white" />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              <span className="w-5 h-[3px] rounded-full bg-white/90" />
              <span className="w-1.5 h-[3px] rounded-full bg-white/40" />
              <span className="w-1.5 h-[3px] rounded-full bg-white/40" />
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Rewards card / freemium notice */}
            {isFreemium ? (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                style={{ backgroundColor: GOLD_BG, borderColor: GOLD }}
              >
                <Info size={15} style={{ color: GOLD }} className="flex-shrink-0" />
                <span className="text-[11px] leading-snug" style={{ color: GOLD_DARK }}>
                  Earn rewards not currently available at this venue
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border-[1.5px]"
                style={{ borderColor: GOLD }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GOLD }}
                >
                  <Star size={16} className="text-white" fill="white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900">Your rewards</div>
                  <div className="text-[10px] text-gray-500 leading-snug">Points convert to pounds at checkout.</div>
                </div>
              </div>
            )}

            {/* Logo + name */}
            <div className="flex items-start gap-2.5">
              <div className="w-11 h-11 rounded-lg bg-gray-900 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {getInitials(name)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: GOLD }}>{name || '—'}</div>
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1"
                  style={{ backgroundColor: GOLD_BG, color: GOLD_DARK }}
                >
                  {category}
                </span>
              </div>
            </div>

            {/* Contact rows */}
            <div className="space-y-1.5">
              {email && (
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Mail size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Phone size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                  {phone}
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Globe size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                  <span className="truncate">{website}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-gray-600">
                <MapPin size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                <span className="truncate">{address || '—'}</span>
              </div>
            </div>

            {initialVenue.google_rating && (
              <div className="flex items-center gap-1 text-[11px]">
                <Star size={12} className="text-amber-500" fill="currentColor" />
                <span style={{ color: GOLD_DARK }} className="font-medium">{initialVenue.google_rating}</span>
              </div>
            )}

            {tagline && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-500 leading-relaxed">{tagline}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
