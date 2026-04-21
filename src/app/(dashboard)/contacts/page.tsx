import { ContactsManager } from "@/components/contacts/contacts-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getContactsDirectory } from "@/lib/data/contacts";

function resolveInitialType(value?: string) {
  return value === "supplier" ? "supplier" : "client";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requirePermission("manageContacts");
  const [{ clients, suppliers }, { type }] = await Promise.all([getContactsDirectory(), searchParams]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Contacts"
        title="Clients & Fournisseurs"
        description="Ajoutez et centralisez vos clients et fournisseurs dans une seule page, avec un choix clair a chaque ajout."
      />

      <ContactsManager clients={clients} suppliers={suppliers} initialView={resolveInitialType(type)} />
    </div>
  );
}
