'use client'

import { useState } from 'react'
import { Star, MapPin, Phone, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import type { PlaceResult } from '@/types'

interface Props {
  onImported: (places: PlaceResult[]) => void
}

const VENUE_TYPES = ['Pub', 'Bar', 'Café', 'Restaurant']

export default function SearchTab({ onImported }: Props) {
  const [location, setLocation] = useState('')
  const [type, setType] = useState('Pub')
  const [radius, setRadius] = useState('3')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!location.trim()) { setError('Enter a location to search'); return }
    setLoading(true); setError(''); setResults([]); setSelected(new Set())

    try {
      const res = await fetch(
        `/api/places/search?location=${encodeURIComponent(location)}&type=${type}&radius=${radius}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (placeId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(placeId) ? next.delete(placeId) : next.add(placeId)
      return next
    })
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/venues/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const importedPlaces = results.filter(r => selected.has(r.place_id))
      onImported(importedPlaces)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Location — e.g. Birmingham B1 or Dudley"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {VENUE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input
            type="number"
            value={radius}
            onChange={e => setRadius(e.target.value)}
            min="1" max="20"
            className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Radius km"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <p className="text-sm text-gray-500">No results found. Try a broader location or different radius.</p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="space-y-2">
            {results.map(place => {
              const isSelected = selected.has(place.place_id)
              return (
                <div
                  key={place.place_id}
                  onClick={() => !place.already_imported && toggleSelect(place.place_id)}
                  className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-colors
                    ${place.already_imported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}
                    ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={place.already_imported}
                    onChange={() => toggleSelect(place.place_id)}
                    className="accent-emerald-600 w-4 h-4 flex-shrink-0 cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{place.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {place.address}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {place.rating && (
                      <span className="flex items-center gap-1 text-xs text-amber-700">
                        <Star size={11} fill="currentColor" /> {place.rating}
                      </span>
                    )}
                    {place.already_imported ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Already imported</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Not listed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-500">
              {selected.size} venue{selected.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing…' : `Import ${selected.size > 0 ? selected.size : ''} to review queue`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
