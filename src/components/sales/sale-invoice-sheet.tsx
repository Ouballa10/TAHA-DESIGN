import { RemoteImage } from "@/components/ui/remote-image";
import { SHOP_NAME } from "@/lib/config";
import {
  amountToFrenchWords,
  buildInvoiceNumber,
  formatCurrency,
  formatDateDayMonth,
  formatPaymentMethod,
  getInvoiceTotals,
} from "@/lib/utils/format";
import { getPublicImageUrl } from "@/lib/utils/images";
import type { SaleDetail, ShopSettings } from "@/types/models";

export function SaleInvoiceSheet({
  sale,
  settings,
}: {
  sale: SaleDetail;
  settings: ShopSettings | null;
}) {
  const companyName = settings?.shop_name ?? SHOP_NAME;
  const isInvoice = sale.invoice_requested;
  const documentLabel = isInvoice ? "Facture" : "Bon de vente";
  const companyTagline = settings?.company_tagline ?? (isInvoice ? "Facture de vente" : "Bon de vente");
  const currency = settings?.currency ?? "MAD";
  const invoicePrefix = settings?.invoice_prefix ?? "FAC";
  const showTax = Boolean(sale.invoice_requested && sale.apply_tax && Number(sale.tax_rate ?? 0) > 0);
  const taxRate = Number(sale.tax_rate ?? 0);
  const totals = getInvoiceTotals({
    subtotal: Number(sale.subtotal ?? sale.total_amount ?? 0),
    taxRate,
    applyTax: showTax,
    taxAmount: Number(sale.tax_amount ?? 0),
    totalAmount: Number(sale.total_amount ?? 0),
  });
  const documentNumber = isInvoice
    ? buildInvoiceNumber(sale.sale_number, sale.sold_at, invoicePrefix)
    : sale.sale_number;
  const amountInWords = amountToFrenchWords(totals.totalAmount, currency);
  const paymentMethodLabel = formatPaymentMethod(sale.payment_method).toUpperCase();
  const logoUrl = getPublicImageUrl(settings?.logo_path);
  const customerName = sale.customer_name || "Client comptoir";
  const customerPhone = sale.customer_phone || "Sans telephone";
  const customerIce = sale.customer_ice?.trim() || null;
  const contactLines = [
    settings?.address,
    settings?.phone ? `Tel: ${settings.phone}` : null,
    settings?.company_email ? `Email: ${settings.company_email}` : null,
    settings?.website_url ? settings.website_url : null,
    settings?.legal_identifier ? settings.legal_identifier : null,
  ].filter(Boolean) as string[];

  return (
    <section className="print-sheet-root rounded-[2rem] border border-border bg-white p-5 shadow-[0_18px_40px_rgba(12,30,37,0.06)] sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="print-sheet-stack space-y-6">
        <div className="print-sheet-block rounded-[2rem] border border-border bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-brand">{documentLabel}</p>
              <p className="print-sheet-title mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {documentNumber}
              </p>
              <p className="mt-3 text-sm text-muted">{isInvoice ? "Emission" : "Vente"} du {formatDateDayMonth(sale.sold_at)}</p>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[25rem]">
              <div className="rounded-[1.25rem] bg-[#f8f4ee] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Date</p>
                <p className="mt-2 font-semibold text-foreground">{formatDateDayMonth(sale.sold_at)}</p>
              </div>
              <div className="rounded-[1.25rem] bg-[#f8f4ee] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Reference</p>
                <p className="mt-2 font-semibold text-foreground">{sale.sale_number}</p>
              </div>
              <div className="rounded-[1.25rem] bg-[#f8f4ee] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Operateur</p>
                <p className="mt-2 font-semibold text-foreground">{sale.created_by_name || "Systeme"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="print-sheet-grid grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="print-sheet-block rounded-[1.75rem] border border-border bg-white p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                <div className="w-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-border bg-[#f7f4ee] sm:w-24">
                  <RemoteImage
                    src={logoUrl}
                    alt={companyName}
                    sizes="96px"
                    className="aspect-square object-contain bg-white p-2.5"
                  />
                </div>
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.35rem] bg-brand text-3xl font-semibold text-white sm:size-24">
                  {companyName.slice(0, 1)}
                </div>
              )}

              <div className="min-w-0">
                <p className="print-sheet-company-title font-display text-[1.85rem] font-semibold leading-tight text-foreground">{companyName}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{companyTagline}</p>

                {contactLines.length > 0 ? (
                  <div className="mt-4 space-y-1.5 text-sm leading-6 text-muted">
                    {contactLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="print-sheet-block rounded-[1.75rem] border border-border bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{isInvoice ? "Facturer a" : "Client"}</p>
            <p className="print-sheet-customer mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">{customerName}</p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
              <p>{customerPhone}</p>
              {isInvoice && customerIce ? <p>ICE: {customerIce}</p> : null}
            </div>
          </div>
        </div>

        <div className="print-sheet-block print-sheet-table overflow-hidden rounded-[1.75rem] border border-border bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-brand text-left text-xs font-semibold uppercase tracking-[0.18em] text-white">
              <tr>
                <th className="px-4 py-4 sm:px-5">Designation</th>
                <th className="px-4 py-4 text-center sm:px-5">Qte</th>
                <th className="px-4 py-4 text-right sm:px-5">{showTax ? "P.U. HT" : "Prix unitaire"}</th>
                {showTax ? <th className="px-4 py-4 text-center sm:px-5">TVA</th> : null}
                <th className="px-4 py-4 text-right sm:px-5">{showTax ? "Total HT" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => {
                return (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex gap-3">
                        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{item.product_name_snapshot}</p>
                          <p className="mt-1 text-sm text-muted">
                            Ref {item.reference_snapshot}
                            {item.variant_label_snapshot ? ` - ${item.variant_label_snapshot}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-foreground sm:px-5">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-sm text-foreground sm:px-5">
                      {formatCurrency(item.unit_price, currency)}
                    </td>
                    {showTax ? (
                      <td className="px-4 py-4 text-center text-sm text-foreground sm:px-5">{taxRate}%</td>
                    ) : null}
                    <td className="px-4 py-4 text-right font-semibold text-foreground sm:px-5">
                      {formatCurrency(item.line_total, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="print-sheet-grid-wide grid gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="print-sheet-block rounded-[1.75rem] border border-border bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              {isInvoice ? "Arrete la presente facture a la somme de :" : "Arrete le present bon de vente a la somme de :"}
            </p>
            <p className="mt-4 text-xl font-semibold italic text-foreground sm:text-2xl">{amountInWords}</p>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Mode de paiement</p>
              <p className="mt-2 text-base font-semibold uppercase tracking-[0.08em] text-foreground">{paymentMethodLabel}</p>
            </div>
          </div>

          <div className="print-sheet-block overflow-hidden rounded-[1.75rem] border border-border bg-white">
            <div className="bg-brand px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white">Synthese</div>
            <div className="space-y-0 px-5 py-3">
              <div className="flex items-center justify-between gap-4 border-b border-border py-3">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">HT</span>
                <span className="text-base font-semibold text-foreground">{formatCurrency(totals.subtotal, currency)}</span>
              </div>

              {showTax ? (
                <div className="flex items-center justify-between gap-4 border-b border-border py-3">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">TVA {taxRate}%</span>
                  <span className="text-base font-semibold text-foreground">{formatCurrency(totals.taxAmount, currency)}</span>
                </div>
              ) : null}

              <div className="flex items-end justify-between gap-4 py-4">
                <span className="text-lg font-semibold uppercase tracking-[0.18em] text-foreground">{showTax ? "TTC" : "Total"}</span>
                <span className="print-sheet-total font-display text-3xl font-semibold text-foreground">
                  {formatCurrency(totals.totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5 text-xs leading-6 text-muted">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p>{settings?.invoice_footer || "Merci pour votre confiance."}</p>
            <p className="sm:text-right">{settings?.website_url || settings?.company_email || companyName}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
