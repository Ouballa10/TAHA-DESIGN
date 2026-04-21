begin;

alter table public.shop_settings
  add column if not exists ice_number text,
  add column if not exists rc_number text,
  add column if not exists if_number text,
  add column if not exists patent_number text,
  add column if not exists cnss_number text,
  add column if not exists capital_social text;

alter table public.suppliers
  add column if not exists supplier_type text not null default 'company'
    check (supplier_type in ('company', 'individual')),
  add column if not exists contact_name text,
  add column if not exists ice_number text;

update public.shop_settings
set
  ice_number = nullif(trim(coalesce(ice_number, '')), ''),
  rc_number = nullif(trim(coalesce(rc_number, '')), ''),
  if_number = nullif(trim(coalesce(if_number, '')), ''),
  patent_number = nullif(trim(coalesce(patent_number, '')), ''),
  cnss_number = nullif(trim(coalesce(cnss_number, '')), ''),
  capital_social = nullif(trim(coalesce(capital_social, '')), '')
where true;

update public.suppliers
set
  supplier_type = coalesce(nullif(trim(coalesce(supplier_type, '')), ''), 'company'),
  contact_name = nullif(trim(coalesce(contact_name, '')), ''),
  ice_number = nullif(trim(coalesce(ice_number, '')), '')
where true;

commit;
