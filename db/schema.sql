-- Kanye Concierge 360 — CRM schema
-- Run this once in your Supabase project (SQL Editor).

create extension if not exists pgcrypto;

-- LEADS -----------------------------------------------------------------
create table if not exists leads (
    id           uuid primary key default gen_random_uuid(),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),

    name         text not null,
    email        text,
    phone        text,
    intent       text,
    budget       text,
    timeline     text,
    message      text,

    -- Where the lead came from
    source       text not null default 'website',   -- website | consultation | property-page | ...
    source_page  text,                              -- full URL of the page they submitted from
    listing_id   text,                              -- optional: which property card they inquired about

    -- Pipeline
    status       text not null default 'new',       -- new | contacted | warm | hot | escrow | closed | lost
    priority     text not null default 'normal',    -- normal | high
    assigned_to  text,                              -- agent email

    -- Raw payload + any enrichment
    meta         jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx  on leads (status);
create index if not exists leads_email_idx   on leads (email);

-- LEAD EVENTS ----------------------------------------------------------
-- Every status change, note, email, sms, or system action gets an event row.
-- This gives each lead a timeline the agent can read top-to-bottom.
create table if not exists lead_events (
    id         uuid primary key default gen_random_uuid(),
    lead_id    uuid not null references leads(id) on delete cascade,
    created_at timestamptz not null default now(),
    kind       text not null,     -- note | status | email_sent | sms_sent | email_in | call | system
    actor      text,              -- agent email, 'system', or 'visitor'
    body       text,
    meta       jsonb not null default '{}'::jsonb
);

create index if not exists lead_events_lead_idx on lead_events (lead_id, created_at desc);

-- AGENT SETTINGS -------------------------------------------------------
-- Single-row table holding the agent profile / notification targets.
create table if not exists agent_settings (
    id                int primary key default 1,
    agent_name        text,
    agent_email       text,
    agent_phone       text,               -- E.164 format (+18306996542) for SMS
    agent_photo_url   text,
    notify_email      boolean not null default true,
    notify_sms        boolean not null default true,
    auto_reply_enabled boolean not null default true,
    auto_reply_subject text,
    auto_reply_body    text,
    updated_at        timestamptz not null default now(),
    constraint agent_settings_singleton check (id = 1)
);

-- Self-serve integrations the agent can wire up from the admin panel.
-- All three values are returned by /api/site-config (public, read-only) so the
-- public site can inject GA / Meta Pixel / Calendly without redeploying.
alter table agent_settings add column if not exists calendly_url   text;
alter table agent_settings add column if not exists ga4_id         text;   -- e.g. G-XXXXXXXXXX
alter table agent_settings add column if not exists meta_pixel_id  text;   -- numeric Facebook Pixel id

insert into agent_settings (id) values (1) on conflict (id) do nothing;

-- updated_at trigger for leads
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
    before update on leads
    for each row execute function set_updated_at();

-- RLS: we expose this DB only via service-role key through serverless
-- functions, so RLS is not strictly required. Enable + deny-all as defense
-- in depth so the anon key cannot read leads directly.
alter table leads         enable row level security;
alter table lead_events   enable row level security;
alter table agent_settings enable row level security;
-- (no policies = no access for anon/authenticated roles; service role bypasses RLS)
