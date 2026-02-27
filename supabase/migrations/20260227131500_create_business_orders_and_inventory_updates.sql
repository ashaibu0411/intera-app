-- Business inventory updates + pickup orders (pay at pickup)
-- Safe to run multiple times (IF NOT EXISTS / DROP POLICY IF EXISTS used).

create extension if not exists pgcrypto;

-- Helper for updated_at timestamps (safe to re-run)
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================
-- INVENTORY UPDATE EVENTS
-- ============================
create table if not exists public.business_inventory_updates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid null references public.business_inventory(id) on delete set null,
  kind text not null,
  title text not null,
  message text not null,
  scope text not null default 'city' check (scope in ('neighborhood', 'city')),
  city text not null,
  neighborhood text null,
  created_at timestamptz not null default now()
);

create index if not exists business_inventory_updates_created_at_idx
  on public.business_inventory_updates(created_at desc);
create index if not exists business_inventory_updates_city_idx
  on public.business_inventory_updates(city);
create index if not exists business_inventory_updates_neighborhood_idx
  on public.business_inventory_updates(neighborhood);
create index if not exists business_inventory_updates_business_idx
  on public.business_inventory_updates(business_id);

alter table public.business_inventory_updates enable row level security;

drop policy if exists "business_inventory_updates_select_all" on public.business_inventory_updates;
create policy "business_inventory_updates_select_all"
  on public.business_inventory_updates
  for select
  to public
  using (true);

drop policy if exists "business_inventory_updates_insert_owner" on public.business_inventory_updates;
create policy "business_inventory_updates_insert_owner"
  on public.business_inventory_updates
  for insert
  to authenticated
  with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- ============================
-- PICKUP ORDERS
-- ============================
create table if not exists public.business_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'ready', 'picked_up', 'cancelled')),
  pickup_time timestamptz null,
  notes text null,
  currency text not null default 'USD',
  subtotal numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_orders_business_idx on public.business_orders(business_id);
create index if not exists business_orders_customer_idx on public.business_orders(customer_id);
create index if not exists business_orders_status_idx on public.business_orders(status);
create index if not exists business_orders_created_at_idx on public.business_orders(created_at desc);

drop trigger if exists set_timestamp_business_orders on public.business_orders;
create trigger set_timestamp_business_orders
before update on public.business_orders
for each row
execute function public.trigger_set_timestamp();

alter table public.business_orders enable row level security;

drop policy if exists "business_orders_select_own" on public.business_orders;
create policy "business_orders_select_own"
  on public.business_orders
  for select
  to authenticated
  using (
    customer_id = auth.uid()
    or business_id in (select id from public.businesses where owner_id = auth.uid())
  );

drop policy if exists "business_orders_insert_customer" on public.business_orders;
create policy "business_orders_insert_customer"
  on public.business_orders
  for insert
  to authenticated
  with check (customer_id = auth.uid());

drop policy if exists "business_orders_update_owner_or_cancel_customer" on public.business_orders;
create policy "business_orders_update_owner_or_cancel_customer"
  on public.business_orders
  for update
  to authenticated
  using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
    or (customer_id = auth.uid() and status = 'pending')
  )
  with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
    or (customer_id = auth.uid() and status = 'cancelled')
  );

-- Order line items
create table if not exists public.business_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.business_orders(id) on delete cascade,
  inventory_item_id uuid not null references public.business_inventory(id) on delete restrict,
  name_snapshot text not null,
  unit_price numeric not null default 0,
  quantity int not null check (quantity > 0),
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_order_items_order_idx on public.business_order_items(order_id);
create index if not exists business_order_items_inventory_idx on public.business_order_items(inventory_item_id);

alter table public.business_order_items enable row level security;

drop policy if exists "business_order_items_select_own" on public.business_order_items;
create policy "business_order_items_select_own"
  on public.business_order_items
  for select
  to authenticated
  using (
    order_id in (
      select o.id
      from public.business_orders o
      where o.customer_id = auth.uid()
         or o.business_id in (select id from public.businesses where owner_id = auth.uid())
    )
  );

drop policy if exists "business_order_items_insert_customer" on public.business_order_items;
create policy "business_order_items_insert_customer"
  on public.business_order_items
  for insert
  to authenticated
  with check (
    order_id in (select o.id from public.business_orders o where o.customer_id = auth.uid())
  );

-- ============================
-- RPC: atomic order creation
-- ============================
create or replace function public.create_business_order(
  p_business_id uuid,
  p_items jsonb,
  p_pickup_time timestamptz default null,
  p_notes text default null
)
returns public.business_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid;
  created public.business_orders;
  it jsonb;
  v_item_id uuid;
  v_qty int;
  v_name text;
  v_price numeric;
  v_in_stock boolean;
  v_available_qty int;
  v_line_total numeric;
  v_subtotal numeric := 0;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not authenticated';
  end if;
  if p_business_id is null then
    raise exception 'business_id is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items are required';
  end if;

  insert into public.business_orders (
    business_id,
    customer_id,
    status,
    pickup_time,
    notes,
    currency,
    subtotal
  )
  values (
    p_business_id,
    caller,
    'pending',
    p_pickup_time,
    nullif(btrim(p_notes), ''),
    'USD',
    0
  )
  returning * into created;

  for it in select * from jsonb_array_elements(p_items)
  loop
    v_item_id := (it->>'inventory_item_id')::uuid;
    v_qty := greatest(coalesce((it->>'quantity')::int, 0), 0);
    if v_item_id is null or v_qty <= 0 then
      raise exception 'invalid item';
    end if;

    -- Lock inventory row for consistent reads + safe decrements
    select bi.name, bi.price, bi.in_stock, bi.quantity
    into v_name, v_price, v_in_stock, v_available_qty
    from public.business_inventory bi
    where bi.id = v_item_id
      and bi.business_id = p_business_id
    for update;

    if v_name is null then
      raise exception 'item_not_found';
    end if;
    if not v_in_stock then
      raise exception 'out_of_stock';
    end if;
    if v_available_qty is not null and v_available_qty < v_qty then
      raise exception 'insufficient_quantity';
    end if;

    v_line_total := (v_price * v_qty);
    v_subtotal := v_subtotal + v_line_total;

    insert into public.business_order_items (
      order_id,
      inventory_item_id,
      name_snapshot,
      unit_price,
      quantity,
      line_total
    )
    values (
      created.id,
      v_item_id,
      v_name,
      v_price,
      v_qty,
      v_line_total
    );

    -- Decrement quantity if tracked
    if v_available_qty is not null then
      update public.business_inventory
      set quantity = (v_available_qty - v_qty),
          in_stock = case when (v_available_qty - v_qty) <= 0 then false else in_stock end,
          updated_at = now()
      where id = v_item_id;
    end if;
  end loop;

  update public.business_orders
  set subtotal = v_subtotal,
      updated_at = now()
  where id = created.id
  returning * into created;

  return created;
end;
$$;

revoke all on function public.create_business_order(uuid, jsonb, timestamptz, text) from public;
grant execute on function public.create_business_order(uuid, jsonb, timestamptz, text) to authenticated;

