'use client'

import { useState, useEffect } from 'react'
import { Star, MapPin, Phone, Mail, Globe, ChevronLeft, Info, Navigation, ChevronUp, X } from 'lucide-react'
import type { Venue, OpeningHours, DayHours } from '@/types'
import { getInitials } from '@/lib/client-utils'

interface Props {
  venue: Venue | null
  onApprove: (venue: Venue) => void
}

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

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '12:00', close: '22:30' },
  tuesday: { open: '12:00', close: '22:30' },
  wednesday: { open: '12:00', close: '22:30' },
  thursday: { open: '12:00', close: '22:30' },
  friday: { open: '12:00', close: '23:00' },
  saturday: { open: '12:00', close: '23:00' },
  sunday: { open: '12:00', close: '23:00' },
}

const todayKey = (): keyof OpeningHours => {
  const idx = new Date().getDay() // 0 = Sunday
  const map: (keyof OpeningHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return map[idx]
}

export default function PreviewTab({ venue: initialVenue, onApprove }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [tagline, setTagline] = useState('')
  const [category, setCategory] = useState('')
  const [amenitiesInput, setAmenitiesInput] = useState('')
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (initialVenue) {
      setName(initialVenue.name)
      setAddress(initialVenue.address)
      setPhone(initialVenue.phone || '')
      setEmail(initialVenue.email || '')
      setWebsite(initialVenue.website || '')
      setLogoUrl(initialVenue.logo_url || '')
      setTagline(initialVenue.tagline || '')
      setCategory(initialVenue.category)
      setAmenitiesInput((initialVenue.amenities || []).join(', '))
      setHours(initialVenue.opening_hours || DEFAULT_HOURS)
    }
  }, [initialVenue])

  if (!initialVenue) {
    return (
      <div className="text-sm text-gray-400 py-12 text-center">
        Select a venue from the Review queue to preview its listing.
      </div>
    )
  }

  const amenities = amenitiesInput.split(',').map(a => a.trim()).filter(Boolean)

  const updateHour = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } as DayHours }))
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/venues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venue_id: initialVenue.id,
        name, address, phone, email, website, tagline, category,
        logo_url: logoUrl,
        amenities,
        opening_hours: hours,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleApprove = async () => {
    await handleSave()
    onApprove({ ...initialVenue, name, address, phone, email, website, tagline, category, logo_url: logoUrl, amenities, opening_hours: hours })
  }

  const isFreemium = initialVenue.tier === 'freemium'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const today = todayKey()

  return (
    <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
      {/* Left — editable NAP + hours + offers */}
      <div className="space-y-5">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-700">NAP data</h2>
          {[
            { label: 'Venue name', value: name, onChange: setName },
            { label: 'Address', value: address, onChange: setAddress },
            { label: 'Phone', value: phone, onChange: setPhone },
            { label: 'Email', value: email, onChange: setEmail },
            { label: 'Website', value: website, onChange: setWebsite },
            { label: 'Logo URL', value: logoUrl, onChange: setLogoUrl },
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
        </div>

        {/* We offer */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">We offer (comma-separated)</label>
          <input
            type="text"
            value={amenitiesInput}
            onChange={e => setAmenitiesInput(e.target.value)}
            placeholder="Live music, Free WiFi, Outdoor seating"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9901] focus:border-transparent"
          />
        </div>

        {/* Opening hours grid */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Opening hours</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {DAYS.map(({ key, label }) => {
              const dh = hours[key] || { open: '', close: '', closed: false }
              return (
                <div key={key} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 last:border-b-0">
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0">{label}</span>
                  <input
                    type="text"
                    value={dh.open}
                    onChange={e => updateHour(key, 'open', e.target.value)}
                    disabled={dh.closed}
                    className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded disabled:bg-gray-50 disabled:text-gray-300"
                  />
                  <span className="text-xs text-gray-400">–</span>
                  <input
                    type="text"
                    value={dh.close}
                    onChange={e => updateHour(key, 'close', e.target.value)}
                    disabled={dh.closed}
                    className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded disabled:bg-gray-50 disabled:text-gray-300"
                  />
                  <label className="flex items-center gap-1 ml-auto text-[10px] text-gray-400">
                    <input
                      type="checkbox"
                      checked={!!dh.closed}
                      onChange={e => updateHour(key, 'closed', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Closed
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Cover photo auto-selected from Google Places. Logo uses initials until a Logo URL is provided — venues can also upload their own after claiming.
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

      {/* Right — full listing preview inside a phone frame */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Listing preview</h2>

        {/* Phone frame */}
        <div className="mx-auto" style={{ width: 328 }}>
          <div className="relative bg-[#111] rounded-[42px] p-[10px] shadow-xl">
            {/* side buttons */}
            <div className="absolute -left-[2px] top-[70px] w-[3px] h-7 bg-[#222] rounded-r" />
            <div className="absolute -left-[2px] top-[104px] w-[3px] h-5 bg-[#222] rounded-r" />
            <div className="absolute -left-[2px] top-[128px] w-[3px] h-5 bg-[#222] rounded-r" />
            <div className="absolute -right-[2px] top-[90px] w-[3px] h-9 bg-[#222] rounded-l" />

            <div className="bg-white rounded-[34px] overflow-hidden">
              {/* status bar sits over the photo */}
              <div className="h-[560px] overflow-y-auto scrollbar-none">
                {/* Header photo */}
                <div className="relative h-40 bg-gray-900 overflow-hidden rounded-b-[42px]">
                  {initialVenue.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={initialVenue.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />

                  {/* status bar */}
                  <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-2 text-white text-[11px] font-medium">
                    <span>9:41</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[10px]">📶</span>
                      <span className="text-[10px]">🔋</span>
                    </span>
                  </div>

                  <div className="absolute top-9 left-2.5 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center">
                    <ChevronLeft size={15} className="text-white" />
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <span className="w-5 h-[3px] rounded-full bg-white/90" />
                    <span className="w-1.5 h-[3px] rounded-full bg-white/40" />
                    <span className="w-1.5 h-[3px] rounded-full bg-white/40" />
                  </div>
                </div>

                <div className="p-3.5 space-y-3">
                  {/* Rewards / freemium notice */}
                  {isFreemium ? (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: GOLD_BG, borderColor: GOLD }}>
                      <Info size={15} style={{ color: GOLD }} className="flex-shrink-0" />
                      <span className="text-[11px] leading-snug" style={{ color: GOLD_DARK }}>
                        Earn rewards not currently available at this venue
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border-[1.5px]" style={{ borderColor: GOLD }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD }}>
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
                    <div className="w-11 h-11 rounded-lg bg-gray-900 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
                      ) : (
                        getInitials(name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: GOLD }}>{name || '—'}</div>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: GOLD_BG, color: GOLD_DARK }}>
                        {category}
                      </span>
                    </div>
                  </div>

                  {/* Contact rows */}
                  <div className="space-y-1.5">
                    {email && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Mail size={13} style={{ color: GOLD }} className="flex-shrink-0" /> <span className="truncate">{email}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Phone size={13} style={{ color: GOLD }} className="flex-shrink-0" /> {phone}
                      </div>
                    )}
                    {website && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Globe size={13} style={{ color: GOLD }} className="flex-shrink-0" /> <span className="truncate">{website}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-gray-600">
                      <MapPin size={13} style={{ color: GOLD }} className="flex-shrink-0" /> <span className="truncate">{address || '—'}</span>
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

                  {/* Locations / hours */}
                  <div className="rounded-xl px-3 py-2.5 border" style={{ backgroundColor: GOLD_BG, borderColor: '#f0dfa0' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} style={{ color: GOLD }} />
                        <span className="text-[11px] font-medium" style={{ color: GOLD_DARK }}>{address.split(',').slice(-2).join(',').trim() || 'Location'}</span>
                      </div>
                      <ChevronUp size={13} style={{ color: GOLD }} />
                    </div>
                    <div className="text-[10px] text-gray-500 mb-2 truncate">{address}</div>

                    <div className="bg-white rounded-lg p-2.5">
                      <div className="text-[11px] font-semibold mb-1" style={{ color: GOLD }}>Opening Hours</div>
                      <div className="space-y-0.5">
                        {DAYS.map(({ key, label }) => {
                          const dh = hours[key]
                          const isToday = key === today
                          return (
                            <div key={key} className="flex justify-between text-[10.5px] py-0.5" style={{ borderTop: '0.5px solid #f0f0f0' }}>
                              <span className={isToday ? 'font-semibold' : 'text-gray-500'} style={isToday ? { color: GOLD } : {}}>{label}</span>
                              <span className={dh?.closed ? 'text-gray-300' : isToday ? 'font-semibold' : 'text-gray-800'} style={isToday && !dh?.closed ? { color: GOLD } : {}}>
                                {dh?.closed ? 'Closed' : `${dh?.open || '—'} - ${dh?.close || '—'}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Get directions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900">Get Directions to Us</span>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium" style={{ color: GOLD }}>
                      Open location
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-100 h-24 bg-gray-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#e8f0e0_0%,#f5f5f0_70%)]" />
                    <div className="relative w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* home indicator */}
            <div className="flex justify-center pt-1.5 pb-0.5">
              <div className="w-24 h-1 rounded-full bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
