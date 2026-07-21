export type VenueStatus = 'pending' | 'approved' | 'claimed' | 'rejected'
export type VenueTier = 'freemium' | 'starter' | 'growth' | 'enterprise'

export interface Venue {
  id: string
  created_at: string
  updated_at: string

  // NAP
  google_place_id: string | null
  name: string
  address: string
  city: string | null
  postcode: string | null
  phone: string | null
  website: string | null
  email: string | null

  // Google metadata
  google_rating: number | null
  google_photo_ref: string | null
  google_types: string[] | null
  lat: number | null
  lng: number | null

  // TavLoy data
  tagline: string | null
  description: string | null
  logo_url: string | null
  cover_url: string | null
  category: string
  opening_hours: OpeningHours | null

  // Status
  status: VenueStatus
  tier: VenueTier

  // Claim
  claim_token: string | null
  claim_token_expires_at: string | null
  claim_sent_at: string | null
  claimed_at: string | null
  claimed_by_email: string | null
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string   // e.g. "11:00"
  close: string  // e.g. "23:00"
  closed?: boolean
}

// Google Places search result (before import)
export interface PlaceResult {
  place_id: string
  name: string
  address: string
  phone?: string
  website?: string
  rating?: number
  photo_ref?: string
  types: string[]
  lat: number
  lng: number
  already_imported: boolean
}

export interface VenueStats {
  total: number
  pending: number
  approved: number
  claimed: number
  rejected: number
}

export interface TrafficStats {
  profile_views: number
  qr_scans: number
  loyalty_taps: number
  orders: number
  period: 'week' | 'month' | 'all'
}
