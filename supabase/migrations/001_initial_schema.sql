-- =============================================
-- PayCripto - Supabase Schema v2
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
-- Extended schema with additional fields for receipt display
create table if not exists transfers (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  recipient_id uuid references recipients(id) on delete set null,
  recipient_address text not null,
  recipient_name text,
  token text not null,
  amount text not null,
  chain_id int not null,
  fee_estimate text,
  tx_hash text,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  fiat_rate numeric,
  fiat_currency text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for transfer history
create index if not exists transfers_user_id_idx on transfers(user_id);
create index if not exists transfers_status_idx on transfers(status);
create index if not exists transfers_created_at_idx on transfers(created_at desc);

-- =============================================
-- RLS Policies (Row Level Security)
-- NOTE: RLS is disabled for now as we use wallet address
-- as user identifier and filter in application code.
-- Enable RLS with custom auth when needed.
-- =============================================

-- Disable RLS for simpler development (filter by user_id in code)
alter table recipients disable row level security;
alter table transfers disable row level security;

-- To enable RLS later, uncomment below:
-- alter table recipients enable row level security;
-- alter table transfers enable row level security;

-- Policy: Users can only see their own recipients
-- create policy "Users can view own recipients"
--   on recipients for select
--   using (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert their own recipients
-- create policy "Users can insert own recipients"
--   on recipients for insert
--   with check (user_id = current_setting('app.user_id', true));

-- Policy: Users can view own transfers
-- create policy "Users can view own transfers"
--   on transfers for select
--   using (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert own transfers
-- create policy "Users can insert own transfers"
--   on transfers for insert
--   with check (user_id = current_setting('app.user_id', true));
