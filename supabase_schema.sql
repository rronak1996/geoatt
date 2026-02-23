-- ============================================================
-- QR Attendance System — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
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

-- 2. Sessions Table
create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  lecture_number  int not null,
  date            date not null,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- 3. Attendance Table
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  student_id  uuid references students(id) on delete cascade,
  marked_at   timestamptz default now(),
  unique(session_id, student_id)   -- prevents duplicate scan
);

-- ============================================================
-- Row Level Security (RLS)
-- Only authenticated users (teachers) can read/write
-- ============================================================

alter table students   enable row level security;
alter table sessions   enable row level security;
alter table attendance enable row level security;

-- Students RLS
create policy "Authenticated full access on students"
  on students for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Sessions RLS
create policy "Authenticated full access on sessions"
  on sessions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Attendance RLS
create policy "Authenticated full access on attendance"
  on attendance for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
