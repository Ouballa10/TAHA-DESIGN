begin;

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_manager_admin" on public.categories
for delete to authenticated
using (public.has_any_role(array['admin', 'manager']));

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_manager_admin" on public.products
for delete to authenticated
using (public.has_any_role(array['admin', 'manager']));

drop policy if exists "variants_delete_admin" on public.product_variants;
create policy "variants_delete_manager_admin" on public.product_variants
for delete to authenticated
using (public.has_any_role(array['admin', 'manager']));

commit;
