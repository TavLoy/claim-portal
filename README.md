# TavLoy Venue Onboarding Portal

Internal tool for importing, reviewing, and claiming venue listings on the TavLoy app.

## Stack
- **Next.js 14** (App Router) · **Supabase** · **Google Places API** · **Resend** · **Tailwind CSS**

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in .env.local with your keys
```

Run schema: `supabase/schema.sql` in Supabase SQL editor, then:

```bash
npm run dev  # → http://localhost:3000 → /portal
```

## Flow
```
/portal          Internal tool
  Tab 1: Search  Google Places → import venues
  Tab 2: Queue   Approve / reject / edit NAP
  Tab 3: Preview Edit listing card
  Tab 4: Send    Fire claim email via Resend

/claim/[token]   Venue-facing claim page
```

## Next steps
- Auth on /portal
- Traffic dashboard for claimed venues  
- Stripe Connect onboarding
- Order at Table menu builder
- TavLet WebSocket integration
