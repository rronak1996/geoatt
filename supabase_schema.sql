-- ============================================================
-- QR Attendance System — Full Supabase SQL Schema
-- Run this FULL script in Supabase SQL Editor
-- (Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS guards)
-- ============================================================

-- 1. Students Table
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  roll_number  text unique not null,
  division     text not null,
  email        text,
  created_at   timestamptz default now()
);

-- 2. Sessions Table (with geo columns)
create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  lecture_number  int not null,
  date            date not null,
  is_active       boolean default true,
  latitude        float,
  longitude       float,
  radius_meters   int default 100,
  created_at      timestamptz default now()
);

-- ⚠️ MIGRATION: Add geo columns if the table already exists without them
alter table sessions add column if not exists latitude      float;
alter table sessions add column if not exists longitude     float;
alter table sessions add column if not exists radius_meters int default 100;

-- 3. Attendance Table (with student location audit)
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  student_id  uuid references students(id) on delete cascade,
  student_lat float,
  student_lng float,
  marked_at   timestamptz default now(),
  unique(session_id, student_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table students   enable row level security;
alter table sessions   enable row level security;
alter table attendance enable row level security;

-- Drop existing policies before recreating (prevents duplicate errors)
drop policy if exists "Auth full access on students"   on students;
drop policy if exists "Auth full access on sessions"   on sessions;
drop policy if exists "Auth full access on attendance" on attendance;
drop policy if exists "Public select students"         on students;
drop policy if exists "Public select sessions"         on sessions;
drop policy if exists "Public insert attendance"       on attendance;

-- Teachers (authenticated) — full access to everything
create policy "Auth full access on students"
  on students for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth full access on sessions"
  on sessions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth full access on attendance"
  on attendance for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Students (public / anon) — read students by roll, read sessions, insert attendance
create policy "Public select students"
  on students for select
  using (true);

create policy "Public select sessions"
  on sessions for select
  using (true);

create policy "Public insert attendance"
  on attendance for insert
  with check (true);
