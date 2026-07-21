'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, Check, X, Mail, Edit2, BarChart2, ExternalLink, Star, RefreshCw } from 'lucide-react'
import type { Venue, VenueStatus, VenueStats } from '@/types'
import { getInitials } from '@/lib/client-utils'

interface Props {
  onPreview: (venue: Venue) => void
  onSendClaim: (venue: Venue) => void
}

const STATUS_FILTERS: { label: string; value: VenueStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Claimed', value: 'claimed' },
  { label: 'Rejected', value: 'rejected' },
]

const STATUS_COLORS: Record<VenueStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  claimed: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function QueueTab({ onPreview, onSendClaim }: Props) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [stats, setStats] = useState<VenueStats | null>(null)
  const [filter, setFilter] = useState<VenueStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchVenues = useCallback(async () => {
    setLoading(true)
    const url = filter === 'all' ? '/api/venues' : `/api/venues?status=${filter}`
    const res = await fetch(url)
    const data = await res.json()
    setVenues(data.venues || [])
    setStats(data.stats || null)
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchVenues() }, [fetchVenues])

  const handleApprove = async (venue: Venue) => {
    setActionLoading(venue.id)
    await fetch('/api/venues/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_id: venue.id, action: 'approve' }),
    })
    await fetchVenues()
    setActionLoading(null)
  }

  const handleReject = async (venue: Venue) => {
    if (!confirm(`Reject ${venue.name}? This can be undone by re-approving.`)) return
    setActionLoading(venue.id)
    await fetch('/api/venues/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_id: venue.id, action: 'reject' }),
    })
    await fetchVenues()
    setActionLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', val: stats.total, color: 'text-gray-900' },
            { label: 'Pending', val: stats.pending, color: 'text-amber-700' },
            { label: 'Approved', val: stats.approved, color: 'text-emerald-700' },
            { label: 'Claimed', val: stats.claimed, color: 'text-purple-700' },
            { label: 'Rejected', val: stats.rejected, color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-medium ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills + refresh */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors
              ${filter === f.value
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
          >
            {f.label}
            {stats && f.value !== 'all' && (
              <span className="ml-1 opacity-60">({stats[f.value as VenueStatus]})</span>
            )}
          </button>
        ))}
        <button
          onClick={fetchVenues}
          className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Venue cards */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading venues…</div>
      ) : venues.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">
          No venues {filter !== 'all' ? `with status "${filter}"` : ''}. Import some from the Search tab.
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map(venue => (
            <div
              key={venue.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-medium text-sm flex-shrink-0">
                  {getInitials(venue.name)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{venue.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[venue.status]}`}>
                      {venue.status}
                    </span>
                    {venue.tier && venue.tier !== 'freemium' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">{venue.tier}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>{venue.address}</span>
                    {venue.phone && <span>{venue.phone}</span>}
                    {venue.google_rating && (
                      <span className="flex items-center gap-0.5 text-amber-700">
                        <Star size={10} fill="currentColor" /> {venue.google_rating}
                      </span>
                    )}
                    {venue.claim_sent_at && (
                      <span className="text-blue-600">Claim sent {new Date(venue.claim_sent_at).toLocaleDateString('en-GB')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                <button
                  onClick={() => onPreview(venue)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={12} /> Preview listing
                </button>

                {venue.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(venue)}
                      disabled={actionLoading === venue.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(venue)}
                      disabled={actionLoading === venue.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X size={12} /> Reject
                    </button>
                  </>
                )}

                {venue.status === 'approved' && (
                  <button
                    onClick={() => onSendClaim(venue)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Mail size={12} /> Send claim email
                  </button>
                )}

                {venue.status === 'claimed' && (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <BarChart2 size={12} /> Dashboard
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <ExternalLink size={12} /> Live listing
                    </button>
                  </>
                )}

                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit2 size={12} /> Edit NAP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
