import { StockEntryForm } from "@/components/forms/stock-entry-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getVariantCatalog } from "@/lib/data/catalog";
import { getSupplierProfiles } from "@/lib/data/contacts";
import { getServerI18n } from "@/lib/i18n/server";

export default async function NewStockEntryPage() {
  const { t } = await getServerI18n();
  const context = await requirePermission("createStockEntry");
  const [variants, suppliers] = await Promise.all([getVariantCatalog(120), getSupplierProfiles()]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Stock")}
        title={t("Nouvelle entree")}
        description={t("Enregistrez une reception fournisseur ou une correction pour garder un stock juste.")}
      />
      <StockEntryForm
        variants={variants}
        suppliers={suppliers}
        allowAdjustments={context.permissions.adjustStock}
      />
    </div>
  );
}
