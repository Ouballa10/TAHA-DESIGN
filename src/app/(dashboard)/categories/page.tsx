import { CategoryForm } from "@/components/forms/category-form";
import { DeleteCategoryForm } from "@/components/forms/delete-category-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";
import { getServerI18n } from "@/lib/i18n/server";

export default async function CategoriesPage() {
  const { t } = await getServerI18n();
  const context = await requireUser();
  await requirePermission("manageCategories");
  const categories = await getCategories();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Organisation")}
        title={t("Categories")}
        description={t("Gardez un catalogue clair pour accelerer les recherches et les ventes.")}
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("Nouvelle categorie")}</CardTitle>
            <CardDescription>{t("Creez une categorie simple et facile a filtrer.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm submitLabel={t("Ajouter la categorie")} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {categories.length === 0 ? (
            <EmptyState
              title={t("Aucune categorie")}
              description={t("Ajoutez d'abord vos grandes familles de produits.")}
            />
          ) : (
            categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{t("Modification rapide de la categorie.")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CategoryForm category={category} submitLabel={t("Mettre a jour")} />
                    {context.permissions.manageCategories ? (
                      <DeleteCategoryForm id={category.id} name={category.name} />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
