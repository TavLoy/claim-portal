'use client'

import { useEffect, useState } from 'react'
import { MailX, RefreshCw } from 'lucide-react'

interface Suppression {
  email: string
  created_at: string
}

export default function UnsubscribesTab() {
  const [items, setItems] = useState<Suppression[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/unsubscribes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.suppressions || [])
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MailX size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {items.length} unsubscribed email{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={fetchList}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-8 text-center">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">
          No unsubscribes yet — this list stays empty until someone opts out.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Unsubscribed</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.email} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-4 py-2.5 text-gray-900">{item.email}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
