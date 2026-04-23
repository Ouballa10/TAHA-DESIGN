import Link from "next/link";
import { notFound } from "next/navigation";

import { SaleInvoiceSheet } from "@/components/sales/sale-invoice-sheet";
import { DeleteSaleForm } from "@/components/forms/delete-sale-form";
import { requirePermission } from "@/lib/auth/session";
import { getSaleById } from "@/lib/data/sales";
import { getShopSettings } from "@/lib/data/users";
import { saleEditPath } from "@/lib/utils/routes";

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requirePermission("recordSale");
  const { id } = await params;
  const sale = await getSaleById(id);
  const settings = await getShopSettings();
  const canManageSale = context.profile.role === "admin" || context.profile.role === "manager";

  if (!sale) {
    notFound();
  }

  return (
    <div className="print-sheet-page space-y-5">
      <div className="print-hidden flex flex-wrap items-center justify-end gap-3">
        <a
          href={`/api/sales/${sale.id}/pdf`}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong"
        >
          Telecharger PDF
        </a>
        <a
          href={`/api/sales/${sale.id}/pdf?mode=inline`}
          target="_blank"
          rel="noreferrer"
          className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-[var(--surface-hover)]"
        >
          Ouvrir PDF
        </a>
        {canManageSale ? (
          <Link
            href={saleEditPath(sale.id)}
            className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-[var(--surface-hover)]"
          >
            Modifier
          </Link>
        ) : null}
        {canManageSale ? <DeleteSaleForm id={sale.id} saleNumber={sale.sale_number} /> : null}
      </div>

      <SaleInvoiceSheet sale={sale} settings={settings} />
    </div>
  );
}
