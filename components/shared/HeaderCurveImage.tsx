'use client'

import { useId } from 'react'
import { ChevronLeft } from 'lucide-react'

const GOLD = '#CC9901'

interface Props {
  coverUrl?: string | null
  height?: number
}

/**
 * Header photo with the asymmetric "flag tail" curve used across the live
 * app: the right side sweeps up in a normal wide scoop, the left side dips
 * further down into a rounded tail before hooking back to the top-left
 * corner, traced with a thin gold stroke.
 *
 * Shared between the admin Listing Preview and the public claim page so the
 * two never drift out of sync with each other again.
 */
export default function HeaderCurveImage({ coverUrl, height = 180 }: Props) {
  const clipId = useId()
  const width = 296

  // Hand-authored approximation of the reference shape — right side is a
  // smooth wide scoop, left side droops into a longer rounded tail before
  // hooking back to the sharp top-left corner.
  const path = `
    M0,0
    L${width},0
    L${width},${height * 0.66}
    C${width},${height * 0.84} ${width * 0.79},${height * 0.95} ${width * 0.68},${height * 0.95}
    C${width * 0.55},${height * 0.96} ${width * 0.49},${height * 0.88} ${width * 0.4},${height * 0.93}
    C${width * 0.29},${height * 0.98} ${width * 0.19},${height * 1.07} ${width * 0.11},${height * 1.08}
    C${width * 0.04},${height * 1.09} -1,${height * 0.99} -2,${height * 0.84}
    C-3,${height * 0.67} 0,${height * 0.33} 0,0
    Z
  `.replace(/\s+/g, ' ').trim()

  return (
    <div className="relative" style={{ height: height * 1.1 }}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="absolute inset-0 bg-gray-900 overflow-hidden"
        style={{ clipPath: `url(#${clipId})`, width, height: height * 1.1 }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/35" />
      </div>

      {/* Gold stroke tracing the same shape */}
      <svg
        viewBox={`0 0 ${width} ${height * 1.1}`}
        width={width}
        height={height * 1.1}
        className="absolute inset-0 pointer-events-none"
      >
        <path d={path} fill="none" stroke={GOLD} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center z-10">
        <ChevronLeft size={15} className="text-white" />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white/90 z-10" style={{ top: height * 0.86 }} />
    </div>
  )
}
