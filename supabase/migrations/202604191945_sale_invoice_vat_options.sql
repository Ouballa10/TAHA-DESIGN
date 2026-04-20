begin;

alter table public.sales
  add column if not exists invoice_requested boolean not null default false,
  add column if not exists apply_tax boolean not null default false,
  add column if not exists tax_rate numeric(5, 2) not null default 0
    check (tax_rate >= 0 and tax_rate <= 100),
  add column if not exists tax_amount numeric(12, 2) not null default 0
    check (tax_amount >= 0),
  add column if not exists customer_ice text;

update public.sales
set
  subtotal = round(coalesce(subtotal, total_amount, 0), 2),
  total_amount = round(coalesce(total_amount, subtotal, 0), 2),
  tax_amount = round(coalesce(tax_amount, 0), 2),
  invoice_requested = coalesce(invoice_requested, false),
  apply_tax = coalesce(apply_tax, false),
  tax_rate = case
    when coalesce(apply_tax, false) then greatest(coalesce(tax_rate, 0), 0)
    else 0
  end,
  customer_ice = nullif(trim(coalesce(customer_ice, '')), '')
where true;

drop function if exists public.create_sale(text, text, text, text, text, timestamptz, jsonb);
drop function if exists public.create_sale(text, text, text, text, text, timestamptz, boolean, boolean, numeric, text, jsonb);

create function public.create_sale(
  p_customer_name text default null,
  p_customer_phone text default null,
  p_payment_status text default 'paid',
  p_payment_method text default 'cash',
  p_note text default null,
  p_sold_at timestamptz default timezone('utc', now()),
  p_invoice_requested boolean default false,
  p_apply_tax boolean default false,
  p_tax_rate numeric default 0,
  p_customer_ice text default null,
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
  v_tax_amount numeric(12, 2) := 0;
  v_total_amount numeric(12, 2) := 0;
  v_profit numeric(12, 2) := 0;
  v_label text;
  v_invoice_requested boolean := coalesce(p_invoice_requested, false);
  v_apply_tax boolean := false;
  v_tax_rate numeric(5, 2) := 0;
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

  v_apply_tax := v_invoice_requested and coalesce(p_apply_tax, false);
  v_tax_rate := case
    when v_apply_tax then greatest(coalesce(p_tax_rate, 0), 0)
    else 0
  end;

  if v_tax_rate > 100 then
    raise exception 'TVA invalide';
  end if;

  perform set_config('app.allow_sale_stock_out', 'true', true);

  insert into public.sales (
    customer_name,
    customer_phone,
    payment_status,
    payment_method,
    note,
    sold_at,
    created_by,
    invoice_requested,
    apply_tax,
    tax_rate,
    customer_ice
  )
  values (
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    coalesce(p_payment_status, 'paid'),
    coalesce(p_payment_method, 'cash'),
    nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_sold_at, timezone('utc', now())),
    auth.uid(),
    v_invoice_requested,
    v_apply_tax,
    v_tax_rate,
    case
      when v_invoice_requested then nullif(trim(coalesce(p_customer_ice, '')), '')
      else null
    end
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

    v_line_total := round(v_quantity * greatest(v_unit_price, 0), 2);
    v_line_profit := round(v_quantity * (greatest(v_unit_price, 0) - greatest(v_variant.purchase_price, 0)), 2);
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

  v_subtotal := round(v_subtotal, 2);
  v_tax_amount := case
    when v_apply_tax and v_tax_rate > 0 then round(v_subtotal * v_tax_rate / 100, 2)
    else 0
  end;
  v_total_amount := round(v_subtotal + v_tax_amount, 2);

  update public.sales
  set
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total_amount,
    estimated_profit = round(v_profit, 2)
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

drop function if exists public.update_sale(uuid, text, text, text, text, text, timestamptz, jsonb);
drop function if exists public.update_sale(uuid, text, text, text, text, text, timestamptz, boolean, boolean, numeric, text, jsonb);

create function public.update_sale(
  p_sale_id uuid,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_payment_status text default 'paid',
  p_payment_method text default 'cash',
  p_note text default null,
  p_sold_at timestamptz default timezone('utc', now()),
  p_invoice_requested boolean default false,
  p_apply_tax boolean default false,
  p_tax_rate numeric default 0,
  p_customer_ice text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale record;
  v_existing_item record;
  v_item jsonb;
  v_variant record;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_line_total numeric(12, 2);
  v_line_profit numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_tax_amount numeric(12, 2) := 0;
  v_total_amount numeric(12, 2) := 0;
  v_profit numeric(12, 2) := 0;
  v_label text;
  v_existing_items_json jsonb := '[]'::jsonb;
  v_requested_items_json jsonb := '[]'::jsonb;
  v_items_changed boolean := false;
  v_restore_note text;
  v_apply_note text;
  v_invoice_requested boolean := coalesce(p_invoice_requested, false);
  v_apply_tax boolean := false;
  v_tax_rate numeric(5, 2) := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if not public.has_any_role(array['admin', 'manager']) then
    raise exception 'Modification de vente non autorisee';
  end if;

  if p_sale_id is null then
    raise exception 'Vente manquante';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne de vente transmise';
  end if;

  if coalesce(p_payment_status, 'paid') not in ('paid', 'partial', 'pending') then
    raise exception 'Statut de paiement invalide';
  end if;

  v_apply_tax := v_invoice_requested and coalesce(p_apply_tax, false);
  v_tax_rate := case
    when v_apply_tax then greatest(coalesce(p_tax_rate, 0), 0)
    else 0
  end;

  if v_tax_rate > 100 then
    raise exception 'TVA invalide';
  end if;

  select
    s.id,
    s.sale_number,
    s.subtotal,
    s.estimated_profit
  into v_sale
  from public.sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception 'Vente introuvable';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'variant_id', si.variant_id,
        'quantity', si.quantity,
        'unit_price', si.unit_price
      )
      order by si.variant_id::text, si.quantity, si.unit_price
    ),
    '[]'::jsonb
  )
  into v_existing_items_json
  from public.sale_items si
  where si.sale_id = p_sale_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'variant_id', (item.value ->> 'variant_id')::uuid,
        'quantity', coalesce((item.value ->> 'quantity')::integer, 0),
        'unit_price', greatest(coalesce((item.value ->> 'unit_price')::numeric, 0), 0)
      )
      order by
        item.value ->> 'variant_id',
        coalesce((item.value ->> 'quantity')::integer, 0),
        greatest(coalesce((item.value ->> 'unit_price')::numeric, 0), 0)
    ),
    '[]'::jsonb
  )
  into v_requested_items_json
  from jsonb_array_elements(p_items) as item(value);

  v_items_changed := v_existing_items_json is distinct from v_requested_items_json;
  v_subtotal := round(coalesce(v_sale.subtotal, 0), 2);
  v_profit := round(coalesce(v_sale.estimated_profit, 0), 2);

  if not v_items_changed then
    v_tax_amount := case
      when v_apply_tax and v_tax_rate > 0 then round(v_subtotal * v_tax_rate / 100, 2)
      else 0
    end;
    v_total_amount := round(v_subtotal + v_tax_amount, 2);

    update public.sales
    set
      customer_name = nullif(trim(coalesce(p_customer_name, '')), ''),
      customer_phone = nullif(trim(coalesce(p_customer_phone, '')), ''),
      payment_status = coalesce(p_payment_status, 'paid'),
      payment_method = coalesce(p_payment_method, 'cash'),
      note = nullif(trim(coalesce(p_note, '')), ''),
      sold_at = coalesce(p_sold_at, sold_at),
      invoice_requested = v_invoice_requested,
      apply_tax = v_apply_tax,
      tax_rate = v_tax_rate,
      tax_amount = v_tax_amount,
      total_amount = v_total_amount,
      customer_ice = case
        when v_invoice_requested then nullif(trim(coalesce(p_customer_ice, '')), '')
        else null
      end,
      updated_at = timezone('utc', now())
    where id = p_sale_id;

    return p_sale_id;
  end if;

  v_restore_note := coalesce(
    nullif(trim(coalesce(p_note, '')), ''),
    format('Correction de la vente %s', v_sale.sale_number)
  );
  v_apply_note := coalesce(
    nullif(trim(coalesce(p_note, '')), ''),
    format('Vente %s modifiee', v_sale.sale_number)
  );

  perform set_config('app.allow_purchase_stock_in', 'true', true);
  perform set_config('app.allow_sale_stock_out', 'true', true);

  for v_existing_item in
    select
      si.variant_id,
      si.quantity
    from public.sale_items si
    where si.sale_id = p_sale_id
      and si.variant_id is not null
    order by si.created_at asc, si.id asc
  loop
    perform public.record_stock_movement(
      v_existing_item.variant_id,
      'in',
      v_existing_item.quantity,
      v_restore_note,
      'sale_restore',
      p_sale_id,
      timezone('utc', now())
    );
  end loop;

  delete from public.sale_items
  where sale_id = p_sale_id;

  v_subtotal := 0;
  v_profit := 0;

  for v_item in
    select value from jsonb_array_elements(p_items)
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
      raise exception 'Variant introuvable pendant la mise a jour';
    end if;

    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, v_variant.selling_price, 0);

    if v_quantity <= 0 then
      raise exception 'Quantite de vente invalide';
    end if;

    if v_variant.quantity_in_stock < v_quantity then
      raise exception 'Stock insuffisant pour %', v_variant.reference;
    end if;

    v_line_total := round(v_quantity * greatest(v_unit_price, 0), 2);
    v_line_profit := round(v_quantity * (greatest(v_unit_price, 0) - greatest(v_variant.purchase_price, 0)), 2);
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
      p_sale_id,
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
      v_apply_note,
      'sale',
      p_sale_id,
      timezone('utc', now())
    );

    v_subtotal := v_subtotal + v_line_total;
    v_profit := v_profit + v_line_profit;
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_tax_amount := case
    when v_apply_tax and v_tax_rate > 0 then round(v_subtotal * v_tax_rate / 100, 2)
    else 0
  end;
  v_total_amount := round(v_subtotal + v_tax_amount, 2);

  update public.sales
  set
    customer_name = nullif(trim(coalesce(p_customer_name, '')), ''),
    customer_phone = nullif(trim(coalesce(p_customer_phone, '')), ''),
    payment_status = coalesce(p_payment_status, 'paid'),
    payment_method = coalesce(p_payment_method, 'cash'),
    note = nullif(trim(coalesce(p_note, '')), ''),
    sold_at = coalesce(p_sold_at, sold_at),
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total_amount,
    estimated_profit = round(v_profit, 2),
    invoice_requested = v_invoice_requested,
    apply_tax = v_apply_tax,
    tax_rate = v_tax_rate,
    customer_ice = case
      when v_invoice_requested then nullif(trim(coalesce(p_customer_ice, '')), '')
      else null
    end,
    updated_at = timezone('utc', now())
  where id = p_sale_id;

  return p_sale_id;
end;
$$;

drop view if exists public.sales_overview;

create view public.sales_overview
with (security_invoker = true)
as
select
  s.id,
  s.sale_number,
  s.customer_name,
  s.customer_phone,
  s.payment_status,
  s.payment_method,
  s.subtotal,
  s.tax_amount,
  s.tax_rate,
  s.invoice_requested,
  s.apply_tax,
  s.customer_ice,
  s.total_amount,
  s.estimated_profit,
  s.note,
  s.sold_at,
  coalesce(p.full_name, p.email) as created_by_name
from public.sales s
left join public.profiles p on p.id = s.created_by;

grant select on public.sales_overview to authenticated;
grant execute on function public.create_sale(text, text, text, text, text, timestamptz, boolean, boolean, numeric, text, jsonb) to authenticated;
grant execute on function public.update_sale(uuid, text, text, text, text, text, timestamptz, boolean, boolean, numeric, text, jsonb) to authenticated;

commit;
