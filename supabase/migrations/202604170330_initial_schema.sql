begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create sequence if not exists public.sale_number_seq start 1;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('admin', 'manager', 'worker')),
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.roles (slug, name, description)
values
  ('admin', 'Administrateur', 'Controle complet de l''application et des utilisateurs'),
  ('manager', 'Responsable', 'Gestion catalogue, stock et ventes sans administration systeme'),
  ('worker', 'Employe', 'Vente, consultation stock et operations autorisees')
on conflict (slug) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  role_id uuid not null references public.roles(id),
  can_record_stock_entries boolean not null default false,
  can_adjust_stock boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  main_photo_path text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reference text not null unique,
  barcode text,
  color text,
  size text,
  type text,
  quantity_in_stock integer not null default 0 check (quantity_in_stock >= 0),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique default format(
    'VTE-%s-%06s',
    to_char(timezone('utc', now()), 'YYYYMMDD'),
    nextval('public.sale_number_seq')
  ),
  customer_name text,
  customer_phone text,
  payment_status text not null default 'paid' check (payment_status in ('paid', 'partial', 'pending')),
  payment_method text not null default 'cash',
  subtotal numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  estimated_profit numeric(12, 2) not null default 0,
  note text,
  sold_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_label_snapshot text not null,
  reference_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  purchase_price_snapshot numeric(12, 2) not null default 0 check (purchase_price_snapshot >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  profit_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_entries (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name_snapshot text,
  note text,
  received_at timestamptz not null default timezone('utc', now()),
  total_cost numeric(12, 2) not null default 0 check (total_cost >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_entry_items (
  id uuid primary key default gen_random_uuid(),
  purchase_entry_id uuid not null references public.purchase_entries(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.product_variants(id) on delete set null,
  reference_snapshot text not null,
  product_name_snapshot text not null,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment')),
  source_type text,
  source_id uuid,
  quantity integer not null check (quantity > 0),
  quantity_delta integer not null,
  previous_quantity integer not null check (previous_quantity >= 0),
  new_quantity integer not null check (new_quantity >= 0),
  note text,
  movement_date timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  supplier_id uuid references public.suppliers(id) on delete set null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shop_settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null default 'TAHA DESIGN',
  phone text,
  address text,
  currency text not null default 'MAD',
  low_stock_global_threshold integer not null default 3 check (low_stock_global_threshold >= 0),
  allow_worker_price_visibility boolean not null default false,
  invoice_footer text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row
execute function public.set_updated_at();

drop trigger if exists trg_sales_updated_at on public.sales;
create trigger trg_sales_updated_at
before update on public.sales
for each row
execute function public.set_updated_at();

drop trigger if exists trg_purchase_entries_updated_at on public.purchase_entries;
create trigger trg_purchase_entries_updated_at
before update on public.purchase_entries
for each row
execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shop_settings_updated_at on public.shop_settings;
create trigger trg_shop_settings_updated_at
before update on public.shop_settings
for each row
execute function public.set_updated_at();

create or replace function public.get_role_slug(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.slug
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = p_user_id
  limit 1;
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and r.slug = required_role
      and p.is_active = true
  );
$$;

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and r.slug = any(required_roles)
      and p.is_active = true
  );
$$;

create or replace function public.can_record_stock_entries()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and (
        p.can_record_stock_entries = true
        or public.has_any_role(array['admin', 'manager'])
      )
  );
$$;

create or replace function public.update_own_profile(p_full_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    updated_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  select id
  into v_role_id
  from public.roles
  where slug = 'worker'
  limit 1;

  insert into public.profiles (
    id,
    email,
    full_name,
    role_id,
    can_record_stock_entries,
    can_adjust_stock,
    is_active
  )
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    v_role_id,
    false,
    false,
    true
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.record_stock_movement(
  p_variant_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_note text default null,
  p_source_type text default 'manual',
  p_source_id uuid default null,
  p_movement_date timestamptz default timezone('utc', now())
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant record;
  v_previous_quantity integer;
  v_delta integer;
  v_quantity integer;
  v_new_quantity integer;
  v_movement_id uuid;
begin
  if p_variant_id is null then
    raise exception 'Variant manquant';
  end if;

  select
    pv.id,
    pv.reference,
    pv.quantity_in_stock,
    p.name as product_name
  into v_variant
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = p_variant_id
  for update;

  if not found then
    raise exception 'Variant introuvable';
  end if;

  if p_quantity = 0 then
    raise exception 'La quantite ne peut pas etre egale a zero';
  end if;

  v_previous_quantity := v_variant.quantity_in_stock;
  v_quantity := abs(p_quantity);

  if p_movement_type = 'in' then
    v_delta := abs(p_quantity);
  elsif p_movement_type = 'out' then
    v_delta := -abs(p_quantity);
  elsif p_movement_type = 'adjustment' then
    v_delta := p_quantity;
  else
    raise exception 'Type de mouvement invalide';
  end if;

  v_new_quantity := v_previous_quantity + v_delta;

  if v_new_quantity < 0 then
    raise exception 'Stock insuffisant pour %', v_variant.reference;
  end if;

  update public.product_variants
  set
    quantity_in_stock = v_new_quantity,
    updated_at = timezone('utc', now())
  where id = p_variant_id;

  insert into public.stock_movements (
    variant_id,
    reference_snapshot,
    product_name_snapshot,
    movement_type,
    source_type,
    source_id,
    quantity,
    quantity_delta,
    previous_quantity,
    new_quantity,
    note,
    movement_date,
    created_by
  )
  values (
    p_variant_id,
    v_variant.reference,
    v_variant.product_name,
    p_movement_type,
    p_source_type,
    p_source_id,
    v_quantity,
    v_delta,
    v_previous_quantity,
    v_new_quantity,
    nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_movement_date, timezone('utc', now())),
    auth.uid()
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

create or replace function public.create_purchase_entry(
  p_supplier_id uuid default null,
  p_supplier_name text default null,
  p_note text default null,
  p_received_at timestamptz default timezone('utc', now()),
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_total_cost numeric(12, 2) := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
  v_purchase_price numeric(12, 2);
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne d''entree transmise';
  end if;

  insert into public.purchase_entries (
    supplier_id,
    supplier_name_snapshot,
    note,
    received_at,
    total_cost,
    created_by
  )
  values (
    p_supplier_id,
    nullif(trim(coalesce(p_supplier_name, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_received_at, timezone('utc', now())),
    0,
    auth.uid()
  )
  returning id into v_entry_id;

  for v_item in
    select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item ->> 'variant_id')::uuid;
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    v_purchase_price := coalesce((v_item ->> 'purchase_price')::numeric, 0);

    if v_variant_id is null or v_quantity <= 0 then
      raise exception 'Ligne d''entree invalide';
    end if;

    insert into public.purchase_entry_items (
      purchase_entry_id,
      variant_id,
      quantity,
      purchase_price
    )
    values (
      v_entry_id,
      v_variant_id,
      v_quantity,
      greatest(v_purchase_price, 0)
    );

    update public.product_variants
    set purchase_price = greatest(v_purchase_price, 0)
    where id = v_variant_id;

    perform public.record_stock_movement(
      v_variant_id,
      'in',
      v_quantity,
      coalesce(p_note, 'Entree fournisseur'),
      'purchase',
      v_entry_id,
      coalesce(p_received_at, timezone('utc', now()))
    );

    v_total_cost := v_total_cost + (v_quantity * greatest(v_purchase_price, 0));
  end loop;

  update public.purchase_entries
  set total_cost = v_total_cost
  where id = v_entry_id;

  return v_entry_id;
end;
$$;

create or replace function public.create_sale(
  p_customer_name text default null,
  p_customer_phone text default null,
  p_payment_status text default 'paid',
  p_payment_method text default 'cash',
  p_note text default null,
  p_sold_at timestamptz default timezone('utc', now()),
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_variant record;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_line_total numeric(12, 2);
  v_line_profit numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_profit numeric(12, 2) := 0;
  v_label text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne de vente transmise';
  end if;

  insert into public.sales (
    customer_name,
    customer_phone,
    payment_status,
    payment_method,
    note,
    sold_at,
    created_by
  )
  values (
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    coalesce(p_payment_status, 'paid'),
    coalesce(p_payment_method, 'cash'),
    nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_sold_at, timezone('utc', now())),
    auth.uid()
  )
  returning id into v_sale_id;

  for v_item in
    select * from jsonb_array_elements(p_items)
  loop
    select
      pv.id,
      pv.reference,
      pv.quantity_in_stock,
      pv.type,
      pv.color,
      pv.size,
      pv.purchase_price,
      pv.selling_price,
      p.name as product_name
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = (v_item ->> 'variant_id')::uuid
    for update;

    if not found then
      raise exception 'Variant introuvable pendant la vente';
    end if;

    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, v_variant.selling_price, 0);

    if v_quantity <= 0 then
      raise exception 'Quantite de vente invalide';
    end if;

    if v_variant.quantity_in_stock < v_quantity then
      raise exception 'Stock insuffisant pour %', v_variant.reference;
    end if;

    v_line_total := v_quantity * greatest(v_unit_price, 0);
    v_line_profit := v_quantity * (greatest(v_unit_price, 0) - greatest(v_variant.purchase_price, 0));
    v_label := coalesce(nullif(concat_ws(' / ', v_variant.type, v_variant.color, v_variant.size), ''), 'Variant simple');

    insert into public.sale_items (
      sale_id,
      variant_id,
      product_name_snapshot,
      variant_label_snapshot,
      reference_snapshot,
      quantity,
      unit_price,
      purchase_price_snapshot,
      line_total,
      profit_amount
    )
    values (
      v_sale_id,
      v_variant.id,
      v_variant.product_name,
      v_label,
      v_variant.reference,
      v_quantity,
      greatest(v_unit_price, 0),
      greatest(v_variant.purchase_price, 0),
      v_line_total,
      v_line_profit
    );

    perform public.record_stock_movement(
      v_variant.id,
      'out',
      v_quantity,
      coalesce(p_note, 'Vente enregistre'),
      'sale',
      v_sale_id,
      coalesce(p_sold_at, timezone('utc', now()))
    );

    v_subtotal := v_subtotal + v_line_total;
    v_profit := v_profit + v_line_profit;
  end loop;

  update public.sales
  set
    subtotal = v_subtotal,
    total_amount = v_subtotal,
    estimated_profit = v_profit
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

create or replace view public.variant_catalog
with (security_invoker = true)
as
select
  pv.id as variant_id,
  p.id as product_id,
  p.name as product_name,
  c.name as category_name,
  p.description,
  p.main_photo_path,
  pv.photo_path,
  coalesce(pv.photo_path, p.main_photo_path) as display_photo_path,
  pv.reference,
  pv.barcode,
  pv.color,
  pv.size,
  pv.type,
  pv.quantity_in_stock,
  pv.selling_price,
  pv.purchase_price,
  pv.minimum_stock,
  (
    pv.quantity_in_stock <=
    case
      when pv.minimum_stock > 0 then pv.minimum_stock
      else coalesce((select low_stock_global_threshold from public.shop_settings order by created_at asc limit 1), 0)
    end
  ) as is_low_stock
from public.product_variants pv
join public.products p on p.id = pv.product_id
left join public.categories c on c.id = p.category_id
where p.is_active = true
  and pv.is_active = true;

create or replace view public.low_stock_variants
with (security_invoker = true)
as
select *
from public.variant_catalog
where is_low_stock = true;

create or replace view public.sales_overview
with (security_invoker = true)
as
select
  s.id,
  s.sale_number,
  s.customer_name,
  s.customer_phone,
  s.payment_status,
  s.payment_method,
  s.total_amount,
  s.estimated_profit,
  s.note,
  s.sold_at,
  coalesce(p.full_name, p.email) as created_by_name
from public.sales s
left join public.profiles p on p.id = s.created_by;

create or replace view public.purchase_entries_overview
with (security_invoker = true)
as
select
  pe.id,
  pe.supplier_name_snapshot,
  pe.note,
  pe.total_cost,
  pe.received_at,
  coalesce(p.full_name, p.email) as created_by_name
from public.purchase_entries pe
left join public.profiles p on p.id = pe.created_by;

create or replace view public.stock_movement_log
with (security_invoker = true)
as
select
  sm.id,
  sm.variant_id,
  sm.reference_snapshot as reference,
  sm.product_name_snapshot as product_name,
  sm.movement_type,
  sm.source_type,
  sm.quantity,
  sm.quantity_delta,
  sm.previous_quantity,
  sm.new_quantity,
  sm.note,
  sm.movement_date,
  coalesce(p.full_name, p.email) as created_by_name
from public.stock_movements sm
left join public.profiles p on p.id = sm.created_by;

create index if not exists idx_profiles_role_id on public.profiles(role_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_categories_name_lower on public.categories(lower(name));
create index if not exists idx_suppliers_name_lower on public.suppliers(lower(name));
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_description_trgm on public.products using gin (description gin_trgm_ops);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_reference_trgm on public.product_variants using gin (reference gin_trgm_ops);
create index if not exists idx_product_variants_barcode on public.product_variants(barcode);
create index if not exists idx_product_variants_stock_alert on public.product_variants(quantity_in_stock, minimum_stock);
create index if not exists idx_sales_sold_at on public.sales(sold_at desc);
create index if not exists idx_purchase_entries_received_at on public.purchase_entries(received_at desc);
create index if not exists idx_stock_movements_variant_date on public.stock_movements(variant_id, movement_date desc);
create index if not exists idx_stock_movements_date on public.stock_movements(movement_date desc);
create index if not exists idx_expenses_date on public.expenses(expense_date desc);

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchase_entries enable row level security;
alter table public.purchase_entry_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.shop_settings enable row level security;

create policy "roles_select_authenticated" on public.roles
for select to authenticated
using (true);

create policy "profiles_select_authenticated" on public.profiles
for select to authenticated
using (true);

create policy "profiles_update_admin" on public.profiles
for update to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "categories_select_authenticated" on public.categories
for select to authenticated
using (true);

create policy "categories_insert_manager_admin" on public.categories
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

create policy "categories_update_manager_admin" on public.categories
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

create policy "categories_delete_admin" on public.categories
for delete to authenticated
using (public.has_role('admin'));

create policy "suppliers_select_authenticated" on public.suppliers
for select to authenticated
using (true);

create policy "suppliers_insert_manager_admin" on public.suppliers
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

create policy "suppliers_update_manager_admin" on public.suppliers
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

create policy "products_select_authenticated" on public.products
for select to authenticated
using (true);

create policy "products_insert_manager_admin" on public.products
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

create policy "products_update_manager_admin" on public.products
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

create policy "products_delete_admin" on public.products
for delete to authenticated
using (public.has_role('admin'));

create policy "variants_select_authenticated" on public.product_variants
for select to authenticated
using (true);

create policy "variants_insert_manager_admin" on public.product_variants
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

create policy "variants_update_manager_admin" on public.product_variants
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

create policy "variants_delete_admin" on public.product_variants
for delete to authenticated
using (public.has_role('admin'));

create policy "sales_select_authenticated" on public.sales
for select to authenticated
using (true);

create policy "sale_items_select_authenticated" on public.sale_items
for select to authenticated
using (true);

create policy "purchase_entries_select_authenticated" on public.purchase_entries
for select to authenticated
using (true);

create policy "purchase_entry_items_select_authenticated" on public.purchase_entry_items
for select to authenticated
using (true);

create policy "stock_movements_select_authenticated" on public.stock_movements
for select to authenticated
using (true);

create policy "expenses_select_authenticated" on public.expenses
for select to authenticated
using (true);

create policy "expenses_insert_manager_admin" on public.expenses
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

create policy "expenses_update_manager_admin" on public.expenses
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

create policy "expenses_delete_admin" on public.expenses
for delete to authenticated
using (public.has_role('admin'));

create policy "shop_settings_select_authenticated" on public.shop_settings
for select to authenticated
using (true);

create policy "shop_settings_insert_admin" on public.shop_settings
for insert to authenticated
with check (public.has_role('admin'));

create policy "shop_settings_update_admin" on public.shop_settings
for update to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

grant execute on function public.update_own_profile(text, text) to authenticated;
grant execute on function public.record_stock_movement(uuid, text, integer, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.create_purchase_entry(uuid, text, text, timestamptz, jsonb) to authenticated;
grant execute on function public.create_sale(text, text, text, text, text, timestamptz, jsonb) to authenticated;

insert into public.shop_settings (shop_name, currency, low_stock_global_threshold, allow_worker_price_visibility, invoice_footer)
select 'TAHA DESIGN', 'MAD', 3, false, 'Merci pour votre confiance.'
where not exists (select 1 from public.shop_settings);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
)
on conflict (id) do nothing;

create policy "product_images_select_authenticated" on storage.objects
for select to authenticated
using (bucket_id = 'product-images');

create policy "product_images_insert_authorized" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (
    public.has_any_role(array['admin', 'manager'])
    or public.can_record_stock_entries()
  )
);

create policy "product_images_update_authorized" on storage.objects
for update to authenticated
using (
  bucket_id = 'product-images'
  and (
    public.has_any_role(array['admin', 'manager'])
    or public.can_record_stock_entries()
  )
)
with check (
  bucket_id = 'product-images'
  and (
    public.has_any_role(array['admin', 'manager'])
    or public.can_record_stock_entries()
  )
);

create policy "product_images_delete_manager_admin" on storage.objects
for delete to authenticated
using (
  bucket_id = 'product-images'
  and public.has_any_role(array['admin', 'manager'])
);

commit;
