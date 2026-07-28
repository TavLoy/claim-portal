'use client'

import { ChevronLeft } from 'lucide-react'

interface Props {
  coverUrl?: string | null
  height?: number
}

/**
 * Header photo with the wide symmetric scoop curve used across the live
 * app: both bottom corners sweep up with a large matching radius, meeting
 * near the middle where the carousel dot sits — a plain, single arc across
 * the width, not an asymmetric shape.
 *
 * Shared between the admin Listing Preview and the public claim page so the
 * two never drift out of sync with each other again.
 */
export default function HeaderCurveImage({ coverUrl, height = 160 }: Props) {
  return (
    <div className="relative">
      <div
        className="relative bg-gray-900 overflow-hidden"
        style={{
          height,
          borderBottomLeftRadius: height * 0.95,
          borderBottomRightRadius: height * 0.95,
        }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/35" />

        <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center z-10">
          <ChevronLeft size={15} className="text-white" />
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white/90 z-10" />
      </div>
    </div>
  )
}
