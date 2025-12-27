-- =============================================
-- PayCripto - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Recipients Table
create table if not exists recipients (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for faster user lookups
create index if not exists recipients_user_id_idx on recipients(user_id);

-- Transfers Table (for history)
create table if not exists transfers (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  recipient_id uuid references recipients(id),
  token text not null,
  amount numeric not null,
  chain_id int not null,
  fee_estimate numeric,
  tx_hash text,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for transfer history
create index if not exists transfers_user_id_idx on transfers(user_id);
create index if not exists transfers_status_idx on transfers(status);

-- =============================================
-- RLS Policies (Row Level Security)
-- =============================================

-- Enable RLS
alter table recipients enable row level security;
alter table transfers enable row level security;

-- Policy: Users can only see their own recipients
create policy "Users can view own recipients"
  on recipients for select
  using (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert their own recipients
create policy "Users can insert own recipients"
  on recipients for insert
  with check (user_id = current_setting('app.user_id', true));

-- Policy: Users can view own transfers
create policy "Users can view own transfers"
  on transfers for select
  using (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert own transfers
create policy "Users can insert own transfers"
  on transfers for insert
  with check (user_id = current_setting('app.user_id', true));
