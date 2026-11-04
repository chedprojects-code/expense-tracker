-- Run this in your Supabase SQL editor

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  initials text not null default '',
  updated_at timestamptz default now()
);

-- Accounts (bank/wallet accounts per user)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  purpose text not null default '',
  balance numeric not null default 0,
  tone text not null default 'violet',
  symbol text not null default '₦',
  created_at timestamptz default now()
);

-- Transactions (income and expenses)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text not null default 'Other',
  description text default '',
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Notes (planned spending)
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric not null,
  due_date date not null,
  category text not null default 'Want',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Savings goals
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Build your safety net',
  current_amount numeric not null default 0,
  target_amount numeric not null default 100000,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table notes enable row level security;
alter table savings_goals enable row level security;

drop policy if exists "Users can manage their own profile" on profiles;
create policy "Users can manage their own profile" on profiles for all using (auth.uid() = id);
drop policy if exists "Users can manage their own accounts" on accounts;
create policy "Users can manage their own accounts" on accounts for all using (auth.uid() = user_id);
drop policy if exists "Users can manage their own transactions" on transactions;
create policy "Users can manage their own transactions" on transactions for all using (auth.uid() = user_id);
drop policy if exists "Users can manage their own notes" on notes;
create policy "Users can manage their own notes" on notes for all using (auth.uid() = user_id);
drop policy if exists "Users can manage their own goals" on savings_goals;
create policy "Users can manage their own goals" on savings_goals for all using (auth.uid() = user_id);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
drop policy if exists "Users can manage their own notifications" on notifications;
create policy "Users can manage their own notifications" on notifications for all using (auth.uid() = user_id);

-- Lenders (people who owe you money)
create table if not exists lenders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz default now()
);

alter table lenders enable row level security;
drop policy if exists "Users can manage their own lenders" on lenders;
create policy "Users can manage their own lenders" on lenders for all using (auth.uid() = user_id);

-- Enable Realtime for live data refresh (run once — skip if already done)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table transactions;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'accounts'
  ) then
    alter publication supabase_realtime add table accounts;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table notes;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'lenders'
  ) then
    alter publication supabase_realtime add table lenders;
  end if;
end $$;

-- Future Expenses (planned spending not yet made)
create table if not exists future_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  due_date date not null default current_date,
  category text not null default 'Other',
  created_at timestamptz default now()
);

alter table future_expenses enable row level security;
drop policy if exists "Users can manage their own future expenses" on future_expenses;
create policy "Users can manage their own future expenses" on future_expenses for all using (auth.uid() = user_id);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'future_expenses'
  ) then
    alter publication supabase_realtime add table future_expenses;
  end if;
end $$;

-- Annual interest on accounts
alter table accounts add column if not exists annual_interest numeric not null default 0;
alter table accounts add column if not exists last_interest_applied_at timestamptz;

-- Vault flag and hidden toggle on accounts
alter table accounts add column if not exists is_vault boolean not null default false;
alter table accounts add column if not exists vault_hidden boolean not null default false;

-- Plain notes (synced to Supabase)
create table if not exists plain_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table plain_notes enable row level security;
drop policy if exists "Users can manage their own plain notes" on plain_notes;
create policy "Users can manage their own plain notes" on plain_notes for all using (auth.uid() = user_id);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'plain_notes'
  ) then
    alter publication supabase_realtime add table plain_notes;
  end if;
end $$;

-- Price range on notes (amount_max = null means exact price)
alter table notes add column if not exists amount_max numeric;

notify pgrst, 'reload schema';
