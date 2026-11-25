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
  balance_as_of date not null default current_date,
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
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

-- Buy List
create table if not exists buy_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'need',
  bought boolean not null default false,
  price numeric,
  created_at timestamptz default now()
);

alter table buy_list_items enable row level security;
drop policy if exists "Users can manage their own buy list" on buy_list_items;
create policy "Users can manage their own buy list" on buy_list_items for all using (auth.uid() = user_id);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'buy_list_items'
  ) then
    alter publication supabase_realtime add table buy_list_items;
  end if;
end $$;

notify pgrst, 'reload schema';

-- Keep the schema aligned with fields used by the dashboard client.
alter table notes add column if not exists sort_order integer not null default 0;
alter table plain_notes add column if not exists sort_order integer not null default 0;
alter table buy_list_items add column if not exists price numeric;
alter table buy_list_items add column if not exists sort_order integer not null default 0;
alter table buy_list_items add column if not exists bought_at timestamptz;

-- Transactions drive account balances from this point forward. Existing
-- balances remain the starting balances; historical transactions stay unlinked.
alter table transactions drop constraint if exists transactions_type_check;
alter table transactions
  add constraint transactions_type_check check (type in ('income', 'expense', 'transfer'));
alter table transactions add column if not exists account_id uuid references accounts(id) on delete set null;
alter table transactions add column if not exists transfer_to_account_id uuid references accounts(id) on delete set null;
alter table transactions add column if not exists buy_list_item_id uuid references buy_list_items(id) on delete set null;
alter table transactions add column if not exists recurring_id uuid;
alter table accounts add column if not exists balance_as_of date not null default current_date;
alter table future_expenses add column if not exists paid_at timestamptz;
alter table future_expenses add column if not exists paid_transaction_id uuid references transactions(id) on delete set null;

drop policy if exists "Users can manage their own transactions" on transactions;
drop policy if exists "Users can view their own transactions" on transactions;
create policy "Users can view their own transactions"
  on transactions for select using (auth.uid() = user_id);

create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null default 'Other',
  description text not null default '',
  account_id uuid references accounts(id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table recurring_transactions enable row level security;
drop policy if exists "Users can manage their own recurring transactions" on recurring_transactions;
create policy "Users can manage their own recurring transactions"
  on recurring_transactions for all using (auth.uid() = user_id);

alter table transactions
  drop constraint if exists transactions_recurring_id_fkey;
alter table transactions
  add constraint transactions_recurring_id_fkey
  foreign key (recurring_id) references recurring_transactions(id) on delete set null;

create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  category text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, month_start, category)
);

alter table monthly_budgets enable row level security;
drop policy if exists "Users can manage their own monthly budgets" on monthly_budgets;
create policy "Users can manage their own monthly budgets"
  on monthly_budgets for all using (auth.uid() = user_id);

create or replace function public.save_account_transaction(
  p_id uuid,
  p_type text,
  p_amount numeric,
  p_category text,
  p_description text,
  p_date date,
  p_account_id uuid default null,
  p_transfer_to_account_id uuid default null,
  p_buy_list_item_id uuid default null,
  p_recurring_id uuid default null
)
returns public.transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old public.transactions%rowtype;
  v_saved public.transactions%rowtype;
  v_existing boolean;
  v_buy_list_item_id uuid;
  v_recurring_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to save a transaction';
  end if;
  if p_id is null or p_date is null or p_type not in ('income', 'expense', 'transfer')
     or p_amount is null or p_amount <= 0
     or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Enter a valid transaction type, date, and positive amount';
  end if;
  if (p_type = 'transfer' and (p_account_id is null or p_transfer_to_account_id is null or p_account_id = p_transfer_to_account_id))
     or (p_type <> 'transfer' and p_transfer_to_account_id is not null) then
    raise exception 'Choose valid accounts for this transaction';
  end if;

  select * into v_old
    from public.transactions
    where id = p_id and user_id = auth.uid()
    for update;
  v_existing := found;
  v_buy_list_item_id := coalesce(p_buy_list_item_id, v_old.buy_list_item_id);
  v_recurring_id := coalesce(p_recurring_id, v_old.recurring_id);

  perform a.id
    from public.accounts a
    where a.user_id = auth.uid()
      and a.id in (v_old.account_id, v_old.transfer_to_account_id, p_account_id, p_transfer_to_account_id)
    order by a.id
    for update;

  if (p_account_id is not null and not exists (
        select 1 from public.accounts where id = p_account_id and user_id = auth.uid()
      )) or (p_transfer_to_account_id is not null and not exists (
        select 1 from public.accounts where id = p_transfer_to_account_id and user_id = auth.uid()
      )) then
    raise exception 'The selected account could not be found';
  end if;
  if v_buy_list_item_id is not null and not exists (
    select 1 from public.buy_list_items where id = v_buy_list_item_id and user_id = auth.uid()
  ) then
    raise exception 'The selected buy-list item could not be found';
  end if;
  if v_recurring_id is not null and not exists (
    select 1 from public.recurring_transactions where id = v_recurring_id and user_id = auth.uid()
  ) then
    raise exception 'The selected recurring transaction could not be found';
  end if;

  if v_existing then
    if v_old.type = 'income' then
      update public.accounts set balance = balance - v_old.amount
        where id = v_old.account_id and user_id = auth.uid() and v_old.date >= balance_as_of;
    elsif v_old.type = 'expense' then
      update public.accounts set balance = balance + v_old.amount
        where id = v_old.account_id and user_id = auth.uid() and v_old.date >= balance_as_of;
    else
      update public.accounts set balance = balance + v_old.amount
        where id = v_old.account_id and user_id = auth.uid() and v_old.date >= balance_as_of;
      update public.accounts set balance = balance - v_old.amount
        where id = v_old.transfer_to_account_id and user_id = auth.uid() and v_old.date >= balance_as_of;
    end if;
  end if;

  if p_type = 'income' and p_account_id is not null then
    update public.accounts set balance = balance + p_amount
      where id = p_account_id and user_id = auth.uid() and p_date >= balance_as_of;
  elsif p_type = 'expense' and p_account_id is not null then
    update public.accounts set balance = balance - p_amount
      where id = p_account_id and user_id = auth.uid() and p_date >= balance_as_of;
  elsif p_type = 'transfer' then
    update public.accounts set balance = balance - p_amount
      where id = p_account_id and user_id = auth.uid() and p_date >= balance_as_of;
    update public.accounts set balance = balance + p_amount
      where id = p_transfer_to_account_id and user_id = auth.uid() and p_date >= balance_as_of;
  end if;

  if v_existing then
    update public.transactions set
      type = p_type,
      amount = p_amount,
      category = coalesce(nullif(p_category, ''), 'Other'),
      description = coalesce(p_description, ''),
      date = p_date,
      account_id = p_account_id,
      transfer_to_account_id = p_transfer_to_account_id,
      buy_list_item_id = v_buy_list_item_id,
      recurring_id = v_recurring_id
    where id = p_id and user_id = auth.uid()
    returning * into v_saved;
  else
    insert into public.transactions (
      id, user_id, type, amount, category, description, date,
      account_id, transfer_to_account_id, buy_list_item_id, recurring_id
    ) values (
      p_id, auth.uid(), p_type, p_amount,
      coalesce(nullif(p_category, ''), 'Other'), coalesce(p_description, ''), p_date,
      p_account_id, p_transfer_to_account_id, v_buy_list_item_id, v_recurring_id
    )
    returning * into v_saved;
  end if;

  return v_saved;
end;
$$;

create or replace function public.delete_account_transaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx public.transactions%rowtype;
begin
  select * into v_tx
    from public.transactions
    where id = p_id and user_id = auth.uid()
    for update;
  if not found then
    raise exception 'Transaction not found';
  end if;

  perform a.id
    from public.accounts a
    where a.user_id = auth.uid() and a.id in (v_tx.account_id, v_tx.transfer_to_account_id)
    order by a.id
    for update;

  if v_tx.type = 'income' then
    update public.accounts set balance = balance - v_tx.amount
      where id = v_tx.account_id and user_id = auth.uid() and v_tx.date >= balance_as_of;
  elsif v_tx.type = 'expense' then
    update public.accounts set balance = balance + v_tx.amount
      where id = v_tx.account_id and user_id = auth.uid() and v_tx.date >= balance_as_of;
  else
    update public.accounts set balance = balance + v_tx.amount
      where id = v_tx.account_id and user_id = auth.uid() and v_tx.date >= balance_as_of;
    update public.accounts set balance = balance - v_tx.amount
      where id = v_tx.transfer_to_account_id and user_id = auth.uid() and v_tx.date >= balance_as_of;
  end if;

  if v_tx.buy_list_item_id is not null then
    update public.buy_list_items set bought = false, bought_at = null
      where id = v_tx.buy_list_item_id and user_id = auth.uid();
  end if;
  update public.future_expenses set paid_at = null, paid_transaction_id = null
    where paid_transaction_id = p_id and user_id = auth.uid();
  delete from public.transactions where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.purchase_buy_list_item(
  p_item_id uuid,
  p_amount numeric,
  p_account_id uuid
)
returns public.transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.buy_list_items%rowtype;
  v_tx public.transactions%rowtype;
begin
  select * into v_item from public.buy_list_items
    where id = p_item_id and user_id = auth.uid() for update;
  if not found or v_item.bought then
    raise exception 'This buy-list item is already purchased or no longer available';
  end if;

  v_tx := public.save_account_transaction(
    gen_random_uuid(), 'expense', p_amount, v_item.category,
    v_item.title, current_date, p_account_id, null, p_item_id, null
  );
  update public.buy_list_items set bought = true, bought_at = now(), price = p_amount
    where id = p_item_id and user_id = auth.uid();
  return v_tx;
end;
$$;

create or replace function public.settle_future_expense(
  p_expense_id uuid,
  p_account_id uuid,
  p_amount numeric
)
returns public.transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expense public.future_expenses%rowtype;
  v_tx public.transactions%rowtype;
begin
  select * into v_expense from public.future_expenses
    where id = p_expense_id and user_id = auth.uid() for update;
  if not found or v_expense.paid_at is not null then
    raise exception 'This planned expense is already paid or no longer available';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Enter a valid payment amount greater than zero';
  end if;

  v_tx := public.save_account_transaction(
    gen_random_uuid(), 'expense', p_amount, v_expense.category,
    v_expense.title, current_date, p_account_id, null, null, null
  );
  update public.future_expenses
    set paid_at = now(), paid_transaction_id = v_tx.id
    where id = p_expense_id and user_id = auth.uid();
  return v_tx;
end;
$$;

create or replace function public.record_recurring_transaction(p_recurring_id uuid)
returns public.transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rule public.recurring_transactions%rowtype;
  v_tx public.transactions%rowtype;
begin
  select * into v_rule from public.recurring_transactions
    where id = p_recurring_id and user_id = auth.uid() and active for update;
  if not found then
    raise exception 'Recurring transaction not found or inactive';
  end if;
  if v_rule.next_date > current_date then
    raise exception 'This recurring transaction is not due yet';
  end if;

  v_tx := public.save_account_transaction(
    gen_random_uuid(), v_rule.type, v_rule.amount, v_rule.category,
    v_rule.description, current_date, v_rule.account_id, null, null, v_rule.id
  );
  update public.recurring_transactions
    set next_date = case
      when frequency = 'weekly' then next_date + 7
      else (next_date + interval '1 month')::date
    end
    where id = p_recurring_id and user_id = auth.uid();
  return v_tx;
end;
$$;

create or replace function public.apply_daily_account_interest(p_account_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_account public.accounts%rowtype;
  v_last_applied timestamptz;
  v_days integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to apply account interest';
  end if;
  for v_account in
    select * from public.accounts
    where user_id = auth.uid()
      and id = any(coalesce(p_account_ids, '{}'::uuid[]))
      and annual_interest > 0
    order by id
    for update
  loop
    v_last_applied := coalesce(v_account.last_interest_applied_at, v_account.created_at);
    v_days := floor(extract(epoch from (now() - v_last_applied)) / 86400);
    if v_days >= 1 then
      update public.accounts
        set balance = balance + (balance * (v_account.annual_interest / 100) * (v_days / 365.0)),
            last_interest_applied_at = now()
        where id = v_account.id and user_id = auth.uid();
    end if;
  end loop;
end;
$$;

revoke all on function public.save_account_transaction(uuid, text, numeric, text, text, date, uuid, uuid, uuid, uuid) from public;
revoke all on function public.delete_account_transaction(uuid) from public;
revoke all on function public.purchase_buy_list_item(uuid, numeric, uuid) from public;
revoke all on function public.settle_future_expense(uuid, uuid, numeric) from public;
revoke all on function public.record_recurring_transaction(uuid) from public;
revoke all on function public.apply_daily_account_interest(uuid[]) from public;
grant execute on function public.save_account_transaction(uuid, text, numeric, text, text, date, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.delete_account_transaction(uuid) to authenticated;
grant execute on function public.purchase_buy_list_item(uuid, numeric, uuid) to authenticated;
grant execute on function public.settle_future_expense(uuid, uuid, numeric) to authenticated;
grant execute on function public.record_recurring_transaction(uuid) to authenticated;
grant execute on function public.apply_daily_account_interest(uuid[]) to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'recurring_transactions'
  ) then
    alter publication supabase_realtime add table recurring_transactions;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'monthly_budgets'
  ) then
    alter publication supabase_realtime add table monthly_budgets;
  end if;
end $$;

-- Public bank logos used by account cards. Run this schema, then upload the
-- files from public/banks through the account dialog.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bank-logos',
  'bank-logos',
  true,
  1000000,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view bank logos" on storage.objects;
create policy "Public can view bank logos"
on storage.objects for select
to public
using (bucket_id = 'bank-logos');

drop policy if exists "Authenticated users can upload bank logos" on storage.objects;
create policy "Authenticated users can upload bank logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'bank-logos'
  and name in (
    'alat.jpg',
    'moniepoint.jpg',
    'opay.png',
    'palmpay.png',
    'piggy.png',
    'pocket.png',
    'smartcash.png'
  )
);

notify pgrst, 'reload schema';
