create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text,
  email text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  saved_addresses text[] not null default '{}'
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image text not null default '',
  images text[],
  price_per_kg numeric not null default 0,
  stock integer not null default 0,
  variety text not null default '',
  origin text not null default '',
  taste_profile text not null default '',
  is_available boolean not null default true,
  variants jsonb not null default '[]'::jsonb
);

alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists image text not null default '';
alter table public.products add column if not exists images text[];
alter table public.products add column if not exists price_per_kg numeric not null default 0;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists variety text not null default '';
alter table public.products add column if not exists origin text not null default '';
alter table public.products add column if not exists taste_profile text not null default '';
alter table public.products add column if not exists is_available boolean not null default true;
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_phone_normalized text,
  delivery_address text not null,
  delivery_area text not null,
  delivery_division text,
  delivery_district text,
  delivery_location text,
  delivery_method text check (delivery_method in ('Home Delivery', 'Courier Pickup')),
  delivery_date date not null,
  payment_method text not null check (payment_method in ('bKash', 'Nagad', 'Cash on Delivery')),
  payment_status text not null default 'Not Required' check (payment_status in ('Not Required', 'Awaiting Verification', 'Received', 'Rejected')),
  payment_sender_phone text,
  payment_transaction_id text,
  payment_confirmation_amount numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  delivery_charge numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  user_id uuid references auth.users (id) on delete set null
);

alter table public.orders add column if not exists customer_phone_normalized text;
alter table public.orders add column if not exists delivery_division text;
alter table public.orders add column if not exists delivery_district text;
alter table public.orders add column if not exists delivery_location text;
alter table public.orders add column if not exists delivery_method text;
alter table public.orders add column if not exists delivery_date date;
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.orders drop constraint if exists orders_delivery_method_check;
alter table public.orders
  add constraint orders_delivery_method_check
  check (delivery_method in ('Home Delivery', 'Courier Pickup') or delivery_method is null);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, phone, email, role, saved_addresses)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.phone,
    new.email,
    'customer',
    '{}'
  )
  on conflict (id) do update
  set
    name = case
      when public.users.name = '' then excluded.name
      else public.users.name
    end,
    phone = coalesce(public.users.phone, excluded.phone),
    email = coalesce(public.users.email, excluded.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

insert into public.users (id, name, phone, email, role, saved_addresses)
select
  auth_user.id,
  coalesce(auth_user.raw_user_meta_data ->> 'full_name', auth_user.raw_user_meta_data ->> 'name', ''),
  auth_user.phone,
  auth_user.email,
  'customer',
  '{}'
from auth.users as auth_user
on conflict (id) do update
set
  name = case
    when public.users.name = '' then excluded.name
    else public.users.name
  end,
  phone = coalesce(public.users.phone, excluded.phone),
  email = coalesce(public.users.email, excluded.email);

alter table public.orders add column if not exists payment_status text not null default 'Not Required';
alter table public.orders add column if not exists payment_sender_phone text;
alter table public.orders add column if not exists payment_transaction_id text;
alter table public.orders add column if not exists payment_confirmation_amount numeric not null default 0;
alter table public.orders alter column payment_status set default 'Not Required';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('Not Required', 'Awaiting Verification', 'Received', 'Rejected'));

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "users_select_own_profile" on public.users;
create policy "users_select_own_profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_insert_own_profile" on public.users;
create policy "users_insert_own_profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_update_own_profile" on public.users;
create policy "users_update_own_profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "products_are_public_readable" on public.products;
create policy "products_are_public_readable"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
on public.products
for all
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
);

drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
on public.orders
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "orders_read_own_or_admin" on public.orders;
create policy "orders_read_own_or_admin"
on public.orders
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
);

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
);

create or replace function public.track_orders_by_phone(p_phone text)
returns setof public.orders
language sql
security definer
set search_path = public
as $$
  select orders.*
  from public.orders
  where regexp_replace(coalesce(orders.customer_phone_normalized, orders.customer_phone), '\D', '', 'g')
    = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
  order by orders.created_at desc
  limit 5;
$$;

grant execute on function public.track_orders_by_phone(text) to anon, authenticated;

create or replace function public.track_order_by_id(p_order_id uuid)
returns public.orders
language sql
security definer
set search_path = public
as $$
  select orders.*
  from public.orders
  where orders.id = p_order_id
  limit 1;
$$;

grant execute on function public.track_order_by_id(uuid) to anon, authenticated;

create or replace function public.create_public_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_phone_normalized text,
  p_delivery_address text,
  p_delivery_area text,
  p_delivery_division text,
  p_delivery_district text,
  p_delivery_location text,
  p_delivery_method text,
  p_delivery_date date,
  p_payment_method text,
  p_payment_status text,
  p_payment_sender_phone text,
  p_payment_transaction_id text,
  p_payment_confirmation_amount numeric,
  p_items jsonb,
  p_subtotal numeric,
  p_delivery_charge numeric,
  p_total numeric,
  p_status text,
  p_created_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
begin
  insert into public.orders (
    customer_name,
    customer_phone,
    customer_phone_normalized,
    delivery_address,
    delivery_area,
    delivery_division,
    delivery_district,
    delivery_location,
    delivery_method,
    delivery_date,
    payment_method,
    payment_status,
    payment_sender_phone,
    payment_transaction_id,
    payment_confirmation_amount,
    items,
    subtotal,
    delivery_charge,
    total,
    status,
    created_at,
    user_id
  )
  values (
    p_customer_name,
    p_customer_phone,
    p_customer_phone_normalized,
    p_delivery_address,
    p_delivery_area,
    p_delivery_division,
    p_delivery_district,
    p_delivery_location,
    p_delivery_method,
    p_delivery_date,
    p_payment_method,
    p_payment_status,
    p_payment_sender_phone,
    p_payment_transaction_id,
    coalesce(p_payment_confirmation_amount, 0),
    coalesce(p_items, '[]'::jsonb),
    coalesce(p_subtotal, 0),
    coalesce(p_delivery_charge, 0),
    coalesce(p_total, 0),
    coalesce(p_status, 'Pending'),
    coalesce(p_created_at, timezone('utc', now())),
    null
  )
  returning id into new_order_id;

  return new_order_id;
end;
$$;

grant execute on function public.create_public_order(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  numeric,
  jsonb,
  numeric,
  numeric,
  numeric,
  text,
  timestamptz
) to anon, authenticated;

create index if not exists orders_customer_phone_idx on public.orders (customer_phone);
create index if not exists orders_customer_phone_normalized_idx on public.orders (customer_phone_normalized);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_user_phone_created_at_idx
on public.orders (user_id, customer_phone_normalized, created_at desc);
