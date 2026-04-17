begin;

insert into public.categories (name, description, sort_order)
values
  ('Bardage', 'Lames, panneaux et accessoires de facade', 1),
  ('Couverture', 'Panneaux, gouttieres et etancheite', 2),
  ('Fixation', 'Visserie, chevilles et consommables', 3),
  ('Peinture', 'Peintures, silicones et finition', 4),
  ('Metal', 'Profiles et tubes metalliques', 5),
  ('Isolation', 'Laine de roche et panneaux isolants', 6)
on conflict (name) do update
set
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.suppliers (name, phone, notes)
values
  ('Atlas Distribution', '0522000001', 'Fournisseur generaliste'),
  ('Nord Panneaux', '0522000002', 'Panneaux sandwich et bardage'),
  ('FixPro', '0522000003', 'Visserie et consommables'),
  ('Colorimex', '0522000004', 'Peinture et produits chimiques'),
  ('Metalux', '0522000005', 'Profiles et acier'),
  ('IsoPlus', '0522000006', 'Solutions isolation')
on conflict (name) do update
set
  phone = excluded.phone,
  notes = excluded.notes;

insert into public.products (category_id, name, slug, description, is_active)
values
  ((select id from public.categories where name = 'Bardage'), 'Bardage PVC', 'bardage-pvc', 'Lames PVC pour facade et finition exterieure.', true),
  ((select id from public.categories where name = 'Couverture'), 'Panneau sandwich', 'panneau-sandwich', 'Panneau toiture et facade en plusieurs epaisseurs.', true),
  ((select id from public.categories where name = 'Fixation'), 'Vis autoforeuses', 'vis-autoforeuses', 'Vis pour bardage, panneau et structure legere.', true),
  ((select id from public.categories where name = 'Metal'), 'Corniere aluminium', 'corniere-aluminium', 'Corniere pour finition et protection d''angles.', true),
  ((select id from public.categories where name = 'Peinture'), 'Peinture facade', 'peinture-facade', 'Peinture de facade resistante aux UV.', true),
  ((select id from public.categories where name = 'Peinture'), 'Silicone sanitaire', 'silicone-sanitaire', 'Mastic silicone usage salle de bain et cuisine.', true),
  ((select id from public.categories where name = 'Metal'), 'Tube acier carre', 'tube-acier-carre', 'Tube acier pour chassis et structure.', true),
  ((select id from public.categories where name = 'Isolation'), 'Laine de roche', 'laine-de-roche', 'Isolation thermique et acoustique.', true),
  ((select id from public.categories where name = 'Couverture'), 'Plaque polycarbonate', 'plaque-polycarbonate', 'Plaques translucides pour pergola et couverture legere.', true),
  ((select id from public.categories where name = 'Couverture'), 'Gouttiere PVC', 'gouttiere-pvc', 'Systeme de gouttiere et evacuation d''eaux pluviales.', true)
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.product_variants (
  product_id,
  reference,
  color,
  size,
  type,
  quantity_in_stock,
  selling_price,
  purchase_price,
  minimum_stock,
  is_active
)
values
  ((select id from public.products where slug = 'bardage-pvc'), 'BDG-PVC-BLC-3M', 'Blanc', '3 m', 'Lisse', 42, 125.00, 92.00, 8, true),
  ((select id from public.products where slug = 'bardage-pvc'), 'BDG-PVC-BGE-3M', 'Beige', '3 m', 'Lisse', 18, 129.00, 96.00, 8, true),
  ((select id from public.products where slug = 'panneau-sandwich'), 'PNS-BLC-40', 'Blanc', '40 mm', 'Toiture', 12, 410.00, 330.00, 4, true),
  ((select id from public.products where slug = 'panneau-sandwich'), 'PNS-GRS-60', 'Gris', '60 mm', 'Facade', 6, 455.00, 365.00, 4, true),
  ((select id from public.products where slug = 'vis-autoforeuses'), 'VIS-AF-4819', null, '4.8x19', 'Boite 250', 55, 65.00, 42.00, 10, true),
  ((select id from public.products where slug = 'vis-autoforeuses'), 'VIS-AF-4835', null, '4.8x35', 'Boite 250', 28, 72.00, 48.00, 10, true),
  ((select id from public.products where slug = 'corniere-aluminium'), 'CRN-ALU-3030', 'Argent', '30x30', 'Angle', 21, 58.00, 39.00, 5, true),
  ((select id from public.products where slug = 'corniere-aluminium'), 'CRN-ALU-5050', 'Blanc', '50x50', 'Angle', 9, 86.00, 61.00, 5, true),
  ((select id from public.products where slug = 'peinture-facade'), 'PNT-FCD-BLC-5L', 'Blanc', '5 L', 'Acrylique', 16, 179.00, 131.00, 4, true),
  ((select id from public.products where slug = 'peinture-facade'), 'PNT-FCD-SBL-15L', 'Sable', '15 L', 'Acrylique', 7, 425.00, 318.00, 4, true),
  ((select id from public.products where slug = 'silicone-sanitaire'), 'SLC-SAN-BLC', 'Blanc', '300 ml', 'Sanitaire', 34, 27.00, 15.00, 6, true),
  ((select id from public.products where slug = 'silicone-sanitaire'), 'SLC-SAN-TRP', 'Transparent', '300 ml', 'Sanitaire', 14, 29.00, 16.00, 6, true),
  ((select id from public.products where slug = 'tube-acier-carre'), 'TAC-2020-2M', null, '20x20', '2 m', 11, 98.00, 72.00, 3, true),
  ((select id from public.products where slug = 'tube-acier-carre'), 'TAC-4040-3M', null, '40x40', '3 m', 4, 238.00, 182.00, 3, true),
  ((select id from public.products where slug = 'laine-de-roche'), 'LDR-50-ROUL', null, '50 mm', 'Rouleau', 19, 145.00, 111.00, 5, true),
  ((select id from public.products where slug = 'laine-de-roche'), 'LDR-100-PANN', null, '100 mm', 'Panneau', 8, 212.00, 166.00, 5, true),
  ((select id from public.products where slug = 'plaque-polycarbonate'), 'PLC-CLR-4MM', 'Clair', '4 mm', 'Alveolaire', 13, 265.00, 214.00, 4, true),
  ((select id from public.products where slug = 'plaque-polycarbonate'), 'PLC-OPL-6MM', 'Opale', '6 mm', 'Alveolaire', 5, 328.00, 271.00, 4, true),
  ((select id from public.products where slug = 'gouttiere-pvc'), 'GTT-PVC-BLC', 'Blanc', '4 m', 'Gouttiere', 15, 84.00, 59.00, 4, true),
  ((select id from public.products where slug = 'gouttiere-pvc'), 'GTT-PVC-MRN', 'Marron', '4 m', 'Gouttiere', 6, 88.00, 63.00, 4, true)
on conflict (reference) do update
set
  product_id = excluded.product_id,
  color = excluded.color,
  size = excluded.size,
  type = excluded.type,
  quantity_in_stock = excluded.quantity_in_stock,
  selling_price = excluded.selling_price,
  purchase_price = excluded.purchase_price,
  minimum_stock = excluded.minimum_stock,
  is_active = excluded.is_active;

insert into public.expenses (label, amount, expense_date, note)
values
  ('Transport fournisseur', 180.00, current_date - 3, 'Livraison de panneaux et bardage'),
  ('Petits consommables', 95.00, current_date - 1, 'Ruban, gants, lames')
on conflict do nothing;

update public.shop_settings
set
  shop_name = 'TAHA DESIGN',
  currency = 'MAD',
  low_stock_global_threshold = 3,
  allow_worker_price_visibility = false,
  invoice_footer = 'Merci pour votre confiance. Prix susceptibles d''evoluer selon arrivage.'
where shop_name is not null;

commit;
