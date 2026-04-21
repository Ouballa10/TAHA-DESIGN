import { StockEntryForm } from "@/components/forms/stock-entry-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getVariantCatalog } from "@/lib/data/catalog";
import { getSupplierProfiles } from "@/lib/data/contacts";

export default async function NewStockEntryPage() {
  const context = await requirePermission("createStockEntry");
  const [variants, suppliers] = await Promise.all([getVariantCatalog(120), getSupplierProfiles()]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Stock"
        title="Nouvelle entree"
        description="Enregistrez une reception fournisseur ou une correction pour garder un stock juste."
      />
      <StockEntryForm
        variants={variants}
        suppliers={suppliers}
        allowAdjustments={context.permissions.adjustStock}
      />
    </div>
  );
}
