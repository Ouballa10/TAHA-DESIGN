begin;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_type text not null default 'individual' check (client_type in ('company', 'individual')),
  contact_name text,
  ice_number text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_clients_name_lower on public.clients(lower(name));

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

insert into public.clients (name, client_type, ice_number, phone)
select
  seed.name,
  seed.client_type,
  seed.ice_number,
  seed.phone
from (
  select distinct
    coalesce(
      nullif(trim(coalesce(customer_name, '')), ''),
      nullif(trim(coalesce(customer_phone, '')), ''),
      nullif(trim(coalesce(customer_ice, '')), '')
    ) as name,
    case
      when nullif(trim(coalesce(customer_ice, '')), '') is not null then 'company'
      else 'individual'
    end as client_type,
    nullif(trim(coalesce(customer_ice, '')), '') as ice_number,
    nullif(trim(coalesce(customer_phone, '')), '') as phone
  from public.sales
) as seed
where seed.name is not null
  and not exists (
    select 1
    from public.clients c
    where lower(c.name) = lower(seed.name)
      and coalesce(c.phone, '') = coalesce(seed.phone, '')
      and coalesce(c.ice_number, '') = coalesce(seed.ice_number, '')
  );

alter table public.clients enable row level security;

drop policy if exists "clients_select_authenticated" on public.clients;
create policy "clients_select_authenticated" on public.clients
for select to authenticated
using (true);

drop policy if exists "clients_insert_manager_admin" on public.clients;
create policy "clients_insert_manager_admin" on public.clients
for insert to authenticated
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists "clients_update_manager_admin" on public.clients;
create policy "clients_update_manager_admin" on public.clients
for update to authenticated
using (public.has_any_role(array['admin', 'manager']))
with check (public.has_any_role(array['admin', 'manager']));

drop policy if exists "clients_delete_admin" on public.clients;
create policy "clients_delete_admin" on public.clients
for delete to authenticated
using (public.has_role('admin'));

commit;
