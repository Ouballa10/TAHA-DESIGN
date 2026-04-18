import { CategoryForm } from "@/components/forms/category-form";
import { DeleteCategoryForm } from "@/components/forms/delete-category-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";

export default async function CategoriesPage() {
  const context = await requireUser();
  await requirePermission("manageCategories");
  const categories = await getCategories();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Organisation"
        title="Categories"
        description="Gardez un catalogue clair pour accelerer les recherches et les ventes."
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle categorie</CardTitle>
            <CardDescription>Creez une categorie simple et facile a filtrer.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm submitLabel="Ajouter la categorie" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {categories.length === 0 ? (
            <EmptyState
              title="Aucune categorie"
              description="Ajoutez d'abord vos grandes familles de produits."
            />
          ) : (
            categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>Modification rapide de la categorie.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <CategoryForm category={category} submitLabel="Mettre a jour" />
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
