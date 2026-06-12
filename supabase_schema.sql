-- =============================================
-- AEGIS DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLE: objects
-- Stores all tracked orbital objects
-- =============================================
create table if not exists objects (
  id              uuid primary key default gen_random_uuid(),
  norad_id        text unique not null,
  name            text not null,
  tle_line1       text not null,
  tle_line2       text not null,
  object_type     text not null default 'UNKNOWN'
                  check (object_type in ('PAYLOAD','DEBRIS','ROCKET_BODY','UNKNOWN')),
  country         text default 'UNKNOWN',
  launch_date     date,
  altitude_km     float,
  inclination_deg float,
  period_min      float,
  eccentricity    float,
  risk_score      int default 0 check (risk_score between 0 and 100),
  is_active       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_objects_norad on objects(norad_id);
create index if not exists idx_objects_type on objects(object_type);
create index if not exists idx_objects_altitude on objects(altitude_km);

-- =============================================
-- TABLE: conjunctions
-- Stores detected close approach events
-- =============================================
create table if not exists conjunctions (
  id                       uuid primary key default gen_random_uuid(),
  object_a_norad           text not null references objects(norad_id),
  object_b_norad           text not null references objects(norad_id),
  time_of_closest_approach timestamptz not null,
  miss_distance_km         float not null,
  collision_probability    float not null,
  relative_velocity_kms    float not null,
  defcon_level             int not null check (defcon_level between 1 and 5),
  status                   text not null default 'ACTIVE'
                           check (status in ('ACTIVE','MONITORING','RESOLVED','MANEUVER_ISSUED')),
  position_a_eci           jsonb,   -- {x, y, z} in km at TCA
  position_b_eci           jsonb,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists idx_conj_status on conjunctions(status);
create index if not exists idx_conj_defcon on conjunctions(defcon_level);
create index if not exists idx_conj_tca on conjunctions(time_of_closest_approach);

-- =============================================
-- TABLE: agent_logs
-- Records every AI agent decision
-- =============================================
create table if not exists agent_logs (
  id              uuid primary key default gen_random_uuid(),
  conjunction_id  uuid not null references conjunctions(id) on delete cascade,
  agent_name      text not null
                  check (agent_name in ('SENTINEL','ANALYST','COMMANDER','HERALD')),
  reasoning       text not null,
  output          jsonb not null default '{}',
  processing_ms   int,
  model_used      text default 'claude-sonnet-4-20250514',
  created_at      timestamptz default now()
);

create index if not exists idx_logs_conjunction on agent_logs(conjunction_id);
create index if not exists idx_logs_agent on agent_logs(agent_name);

-- =============================================
-- TABLE: chat_sessions
-- Stores AEGIS chat history
-- =============================================
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  role        text not null check (role in ('user','aegis')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_chat_session on chat_messages(session_id);

-- =============================================
-- TABLE: sync_log
-- Records TLE data sync history
-- =============================================
create table if not exists sync_log (
  id               uuid primary key default gen_random_uuid(),
  source           text not null,
  objects_synced   int default 0,
  objects_updated  int default 0,
  duration_ms      int,
  error            text,
  created_at       timestamptz default now()
);

-- =============================================
-- REALTIME: Enable for live updates
-- =============================================
alter publication supabase_realtime add table conjunctions;
alter publication supabase_realtime add table agent_logs;
alter publication supabase_realtime add table chat_messages;

-- =============================================
-- ROW LEVEL SECURITY: Allow reads for anon key
-- =============================================
alter table objects         enable row level security;
alter table conjunctions    enable row level security;
alter table agent_logs      enable row level security;
alter table chat_messages   enable row level security;
alter table sync_log        enable row level security;

-- Allow public reads
create policy "Public read objects"
  on objects for select using (true);

create policy "Public read conjunctions"
  on conjunctions for select using (true);

create policy "Public read agent_logs"
  on agent_logs for select using (true);

create policy "Public read chat"
  on chat_messages for select using (true);

create policy "Public read sync_log"
  on sync_log for select using (true);
