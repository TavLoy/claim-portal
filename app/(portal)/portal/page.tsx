'use client'

import { useState } from 'react'
import SearchTab from '@/components/portal/SearchTab'
import QueueTab from '@/components/portal/QueueTab'
import PreviewTab from '@/components/portal/PreviewTab'
import SendClaimTab from '@/components/portal/SendClaimTab'
import type { Venue, PlaceResult } from '@/types'

const TABS = ['Search', 'Review queue', 'Listing preview', 'Send claim']

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [importedPlaces, setImportedPlaces] = useState<PlaceResult[]>([])

  const goToTab = (tab: number, venue?: Venue) => {
    if (venue) setSelectedVenue(venue)
    setActiveTab(tab)
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm transition-colors border-r border-gray-200 last:border-r-0
              ${activeTab === i
                ? 'bg-white font-medium text-gray-900'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
          >
            <span className="text-gray-400 mr-1">{i + 1}</span> {tab}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 0 && (
        <SearchTab
          onImported={(places) => {
            setImportedPlaces(places)
            setActiveTab(1)
          }}
        />
      )}
      {activeTab === 1 && (
        <QueueTab
          onPreview={(venue) => goToTab(2, venue)}
          onSendClaim={(venue) => goToTab(3, venue)}
        />
      )}
      {activeTab === 2 && (
        <PreviewTab
          venue={selectedVenue}
          onApprove={(venue) => goToTab(3, venue)}
        />
      )}
      {activeTab === 3 && (
        <SendClaimTab venue={selectedVenue} />
      )}
    </div>
  )
}
