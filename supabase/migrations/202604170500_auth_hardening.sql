begin;

create or replace function public.can_adjust_stock()
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
      and p.is_active = true
      and (
        r.slug = 'admin'
        or p.can_adjust_stock = true
      )
  );
$$;

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
  v_internal_sale boolean := coalesce(current_setting('app.allow_sale_stock_out', true), '') = 'true';
  v_internal_purchase boolean := coalesce(current_setting('app.allow_purchase_stock_in', true), '') = 'true';
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_movement_type = 'in'
    and not (
      v_internal_purchase
      or public.has_any_role(array['admin', 'manager'])
      or public.can_record_stock_entries()
    )
  then
    raise exception 'Entree de stock non autorisee';
  end if;

  if p_movement_type = 'out' and not v_internal_sale then
    raise exception 'Sortie de stock non autorisee';
  end if;

  if p_movement_type = 'adjustment' and not public.can_adjust_stock() then
    raise exception 'Correction de stock non autorisee';
  end if;

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
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if not public.can_record_stock_entries() then
    raise exception 'Entree de stock non autorisee';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne d''entree transmise';
  end if;

  perform set_config('app.allow_purchase_stock_in', 'true', true);

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
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if not public.has_any_role(array['admin', 'manager', 'worker']) then
    raise exception 'Vente non autorisee';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne de vente transmise';
  end if;

  perform set_config('app.allow_sale_stock_out', 'true', true);

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

grant execute on function public.can_adjust_stock() to authenticated;

commit;
