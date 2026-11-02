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

-- Enable Realtime for live data refresh (run once)
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table accounts;
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table lenders;

notify pgrst, 'reload schema';
