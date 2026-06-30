-- ════════════════════════════════════════════════════════════════════
-- Team Timeline Planner — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════════════════════

-- ── Members table ───────────────────────────────────────────────────
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ── Tasks table ─────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner       text,
  start_date  date,
  end_date    date,
  priority    text default 'Medium' check (priority in ('High','Medium','Low')),
  note        text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Subtasks table ──────────────────────────────────────────────────
create table if not exists subtasks (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  name        text not null,
  status      text not null default 'รอ' check (status in ('รอ','กำลังทำ','เสร็จ')),
  owner       text,
  due_date    date,
  sort_order  integer default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_subtasks_task_id on subtasks(task_id);

-- ── Auto-update updated_at ──────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists trg_subtasks_updated_at on subtasks;
create trigger trg_subtasks_updated_at
  before update on subtasks
  for each row execute function set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────
-- Open policy for team-shared use (no per-user login required).
-- Tighten this later if you add Supabase Auth.

alter table members  enable row level security;
alter table tasks     enable row level security;
alter table subtasks  enable row level security;

create policy "Allow all read members"   on members   for select using (true);
create policy "Allow all write members"  on members   for insert with check (true);
create policy "Allow all update members" on members   for update using (true);
create policy "Allow all delete members" on members   for delete using (true);

create policy "Allow all read tasks"     on tasks      for select using (true);
create policy "Allow all write tasks"    on tasks      for insert with check (true);
create policy "Allow all update tasks"   on tasks      for update using (true);
create policy "Allow all delete tasks"   on tasks      for delete using (true);

create policy "Allow all read subtasks"  on subtasks   for select using (true);
create policy "Allow all write subtasks" on subtasks   for insert with check (true);
create policy "Allow all update subtasks" on subtasks  for update using (true);
create policy "Allow all delete subtasks" on subtasks  for delete using (true);

-- ── Realtime (optional — lets all browsers sync live) ──────────────
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table subtasks;
alter publication supabase_realtime add table members;

-- ── Seed sample data (optional, comment out if not needed) ─────────
insert into members (name) values
  ('สมชาย กิตติ'), ('มาลี สุวรรณ'), ('นิดา ชัยศรี')
on conflict (name) do nothing;
