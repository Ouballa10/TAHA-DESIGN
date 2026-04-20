begin;

alter table public.shop_settings
  add column if not exists company_tagline text,
  add column if not exists company_email text,
  add column if not exists website_url text,
  add column if not exists legal_identifier text,
  add column if not exists logo_path text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists invoice_prefix text not null default 'FAC',
  add column if not exists show_tax_on_invoice boolean not null default false,
  add column if not exists tax_rate numeric(5, 2) not null default 20
    check (tax_rate >= 0 and tax_rate <= 100);

update public.shop_settings
set
  invoice_prefix = coalesce(nullif(trim(invoice_prefix), ''), 'FAC'),
  show_tax_on_invoice = coalesce(show_tax_on_invoice, false),
  tax_rate = coalesce(tax_rate, 20)
where true;

commit;
