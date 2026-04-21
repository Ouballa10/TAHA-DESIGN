begin;

drop policy if exists "clients_delete_admin" on public.clients;
drop policy if exists "clients_delete_manager_admin" on public.clients;
create policy "clients_delete_manager_admin" on public.clients
for delete to authenticated
using (public.has_any_role(array['admin', 'manager']));

drop policy if exists "suppliers_delete_admin" on public.suppliers;
drop policy if exists "suppliers_delete_manager_admin" on public.suppliers;
create policy "suppliers_delete_manager_admin" on public.suppliers
for delete to authenticated
using (public.has_any_role(array['admin', 'manager']));

commit;
