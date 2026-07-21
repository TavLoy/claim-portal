-- TavLoy Venue Portal Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- VENUES
-- ─────────────────────────────────────────────
create type venue_status as enum ('pending', 'approved', 'claimed', 'rejected');
create type venue_tier as enum ('freemium', 'starter', 'growth', 'enterprise');

create table venues (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  -- NAP data (from Google Places)
  google_place_id text unique,
  name            text not null,
  address         text not null,
  city            text,
  postcode        text,
  phone           text,
  website         text,
  email           text,

  -- Google metadata
  google_rating   numeric(2,1),
  google_photo_ref text,
  google_types    text[],
  lat             numeric(10,7),
  lng             numeric(10,7),

  -- TavLoy data
  tagline         text,
  description     text,
  logo_url        text,
  cover_url       text,
  category        text default 'Pub',
  opening_hours   jsonb,

  -- Status & tier
  status          venue_status default 'pending',
  tier            venue_tier default 'freemium',

  -- Claim
  claim_token     text unique,
  claim_token_expires_at timestamptz,
  claim_sent_at   timestamptz,
  claimed_at      timestamptz,
  claimed_by_email text,

  -- Soft delete
  deleted_at      timestamptz
);

-- Index for fast status filtering
create index venues_status_idx on venues(status);
create index venues_claim_token_idx on venues(claim_token);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venues_updated_at
  before update on venues
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- VENUE EVENTS (audit log)
-- ─────────────────────────────────────────────
create type venue_event_type as enum (
  'imported', 'approved', 'rejected', 'claim_sent',
  'claimed', 'profile_updated', 'tier_upgraded'
);

create table venue_events (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  venue_id    uuid references venues(id) on delete cascade,
  event_type  venue_event_type not null,
  metadata    jsonb,
  actor_email text
);

create index venue_events_venue_idx on venue_events(venue_id);

-- ─────────────────────────────────────────────
-- VENUE TRAFFIC (analytics)
-- ─────────────────────────────────────────────
create table venue_traffic (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  venue_id    uuid references venues(id) on delete cascade,
  event       text not null, -- 'profile_view' | 'qr_scan' | 'loyalty_tap' | 'order'
  session_id  text,
  metadata    jsonb
);

create index venue_traffic_venue_idx on venue_traffic(venue_id, created_at desc);

-- ─────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────
-- Venues table: only service role can write; public can read claimed venues
alter table venues enable row level security;

create policy "Public can view claimed venues"
  on venues for select
  using (status = 'claimed' and deleted_at is null);

create policy "Service role full access"
  on venues for all
  using (auth.role() = 'service_role');

-- Traffic: venues can view their own traffic via claim token (handled in API)
alter table venue_traffic enable row level security;

create policy "Service role full access on traffic"
  on venue_traffic for all
  using (auth.role() = 'service_role');

-- Events: service role only
alter table venue_events enable row level security;

create policy "Service role full access on events"
  on venue_events for all
  using (auth.role() = 'service_role');
