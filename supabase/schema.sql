-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Predictions are keyed to auth.users, so Supabase Auth must be set up first
-- (it is, by default, on every project).

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  home_score integer,
  away_score integer,
  predicted_winner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table predictions enable row level security;

create policy "Users can view own predictions"
  on predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert own predictions"
  on predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own predictions"
  on predictions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own predictions"
  on predictions for delete
  using (auth.uid() = user_id);

-- Keeps updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger predictions_set_updated_at
  before update on predictions
  for each row
  execute function set_updated_at();
