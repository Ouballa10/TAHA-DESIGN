"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createContactAction, deleteContactAction } from "@/lib/actions/contact-actions";
import { cn } from "@/lib/utils/cn";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ClientProfileItem, ContactEntityType, SupplierDirectoryItem } from "@/types/models";

type ContactKind = "client" | "supplier";

type ContactDraft = {
  id: string;
  kind: ContactKind;
  entityType: ContactEntityType;
  name: string;
  iceNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

function kindLabel(kind: ContactKind) {
  return kind === "client" ? "Client" : "Fournisseur";
}

function defaultEntityType(kind: ContactKind): ContactEntityType {
  return kind === "supplier" ? "company" : "individual";
}

function createEmptyDraft(kind: ContactKind): ContactDraft {
  return {
    id: "",
    kind,
    entityType: defaultEntityType(kind),
    name: "",
    iceNumber: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  };
}

function clientToDraft(client: ClientProfileItem): ContactDraft {
  return {
    id: client.id,
    kind: "client",
    entityType: client.client_type,
    name: client.name,
    iceNumber: client.ice_number ?? "",
    contactName: client.contact_name ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    notes: client.notes ?? "",
  };
}

function supplierToDraft(supplier: SupplierDirectoryItem): ContactDraft {
  return {
    id: supplier.id,
    kind: "supplier",
    entityType: supplier.supplier_type,
    name: supplier.name,
    iceNumber: supplier.ice_number ?? "",
    contactName: supplier.contact_name ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
  };
}

function SegmentButton({
  active,
  label,
  description,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 rounded-[1.5rem] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70",
        active ? "border-[#8de8c8] bg-[#ebfff6] text-[#0b8c60]" : "border-border bg-white text-foreground hover:bg-[#f8fbff]",
      )}
    >
      <p className="text-base font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.75rem] border p-5 text-left shadow-[0_14px_34px_rgba(18,33,38,0.04)] transition",
        active ? "border-[#8de8c8] bg-[#ebfff6]" : "border-border bg-white hover:bg-[#f8fbff]",
      )}
    >
      <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", active ? "text-[#0b9f6a]" : "text-brand")}>
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-semibold text-foreground">{value}</p>
    </button>
  );
}

function ContactCard({
  id,
  kind,
  title,
  subtitle,
  badge,
  contactName,
  iceNumber,
  phone,
  email,
  address,
  notes,
  onEdit,
  deleteAction,
}: {
  id: string;
  kind: ContactKind;
  title: string;
  subtitle: string;
  badge: string;
  contactName: string | null;
  iceNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_14px_34px_rgba(18,33,38,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <span className="rounded-full bg-[#e9fff5] px-3 py-1 text-xs font-semibold text-[#0b8c60]">{badge}</span>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
        {contactName ? <p>Contact: {contactName}</p> : null}
        {iceNumber ? <p>ICE: {iceNumber}</p> : null}
        {phone ? <p>Tel: {phone}</p> : null}
        {email ? <p>Email: {email}</p> : null}
        {address ? <p>{address}</p> : null}
        {notes ? <p>Note: {notes}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onEdit}>
          Modifier
        </Button>

        <form action={deleteAction}>
          <input type="hidden" name="contact_id" value={id} />
          <input type="hidden" name="contact_kind" value={kind} />
          <ConfirmSubmitButton
            type="submit"
            variant="danger"
            message={`Supprimer ${kind === "client" ? "ce client" : "ce fournisseur"} ?`}
          >
            Supprimer
          </ConfirmSubmitButton>
        </form>
      </div>
    </article>
  );
}

export function ContactsManager({
  clients,
  suppliers,
  initialView = "client",
}: {
  clients: ClientProfileItem[];
  suppliers: SupplierDirectoryItem[];
  initialView?: ContactKind;
}) {
  const [saveState, saveFormAction] = useActionState(createContactAction, initialActionState);
  const [deleteState, deleteFormAction] = useActionState(deleteContactAction, initialActionState);
  const [activeTab, setActiveTab] = useState<ContactKind>(initialView);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ContactDraft>(createEmptyDraft(initialView));
  useActionToast(saveState);
  useActionToast(deleteState);

  useEffect(() => {
    if (saveState.success) {
      const timeoutId = window.setTimeout(() => {
        setActiveTab(draft.kind);
        setIsOpen(false);
        setDraft(createEmptyDraft(draft.kind));
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [draft.kind, saveState.success]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const currentItems = useMemo(
    () => (activeTab === "client" ? clients : suppliers),
    [activeTab, clients, suppliers],
  );

  const isEditing = Boolean(draft.id);
  const isClient = draft.kind === "client";
  const nameLabel =
    draft.entityType === "company"
      ? isClient
        ? "Nom du client / Societe"
        : "Nom de la Societe"
      : "Nom complet";
  const namePlaceholder =
    draft.entityType === "company"
      ? isClient
        ? "Ex: Client SARL"
        : "Ex: Fournisseur SARL"
      : isClient
        ? "Ex: M. Client"
        : "Ex: M. Fournisseur";
  const modalTitle = isEditing ? `Modifier le ${kindLabel(draft.kind).toLowerCase()}` : "Ajouter un contact";
  const submitLabel = isEditing ? "Enregistrer les modifications" : `Enregistrer le ${kindLabel(draft.kind).toLowerCase()}`;
  const formKey = `${draft.kind}-${draft.id || "new"}-${draft.entityType}`;

  const openCreateModal = (kind: ContactKind) => {
    setDraft(createEmptyDraft(kind));
    setIsOpen(true);
  };

  const openEditModal = (nextDraft: ContactDraft) => {
    setActiveTab(nextDraft.kind);
    setDraft(nextDraft);
    setIsOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard label="Clients" value={clients.length} active={activeTab === "client"} onClick={() => setActiveTab("client")} />
        <SummaryCard
          label="Fournisseurs"
          value={suppliers.length}
          active={activeTab === "supplier"}
          onClick={() => setActiveTab("supplier")}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border bg-white p-4 shadow-[0_14px_34px_rgba(18,33,38,0.04)] lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
          <SegmentButton
            active={activeTab === "client"}
            label="Clients"
            description="Profils commerciaux"
            onClick={() => setActiveTab("client")}
          />
          <SegmentButton
            active={activeTab === "supplier"}
            label="Fournisseurs"
            description="Achats et approvisionnement"
            onClick={() => setActiveTab("supplier")}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => openCreateModal(activeTab)}>
            Ajouter un {activeTab === "client" ? "client" : "fournisseur"}
          </Button>
          <Button onClick={() => openCreateModal(activeTab)}>Choisir quoi ajouter</Button>
        </div>
      </div>

      {currentItems.length === 0 ? (
        <EmptyState
          title={activeTab === "client" ? "Aucun client enregistre" : "Aucun fournisseur enregistre"}
          description={
            activeTab === "client"
              ? "Ajoutez votre premier client depuis cette page commune pour garder vos contacts propres."
              : "Ajoutez votre premier fournisseur ici pour centraliser vos achats dans la meme interface."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeTab === "client"
            ? clients.map((client) => (
                <ContactCard
                  key={client.id}
                  id={client.id}
                  kind="client"
                  title={client.name}
                  subtitle={client.client_type === "company" ? "Client entreprise" : "Client particulier"}
                  badge={client.client_type === "company" ? "Entreprise" : "Particulier"}
                  contactName={client.contact_name}
                  iceNumber={client.ice_number}
                  phone={client.phone}
                  email={client.email}
                  address={client.address}
                  notes={client.notes}
                  onEdit={() => openEditModal(clientToDraft(client))}
                  deleteAction={deleteFormAction}
                />
              ))
            : suppliers.map((supplier) => (
                <ContactCard
                  key={supplier.id}
                  id={supplier.id}
                  kind="supplier"
                  title={supplier.name}
                  subtitle={supplier.supplier_type === "company" ? "Fournisseur entreprise" : "Fournisseur particulier"}
                  badge={supplier.supplier_type === "company" ? "Entreprise" : "Particulier"}
                  contactName={supplier.contact_name}
                  iceNumber={supplier.ice_number}
                  phone={supplier.phone}
                  email={supplier.email}
                  address={supplier.address}
                  notes={supplier.notes}
                  onEdit={() => openEditModal(supplierToDraft(supplier))}
                  deleteAction={deleteFormAction}
                />
              ))}
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-foreground/35 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-6">
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_24px_60px_rgba(18,33,38,0.22)] sm:max-h-[calc(100dvh-3rem)]">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 pb-5 pt-5 sm:px-6">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">{modalTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {isEditing
                      ? "Modifiez les informations puis enregistrez vos changements."
                      : "Choisissez d'abord si vous ajoutez un client ou un fournisseur, puis renseignez ses coordonnees."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-[#f8fbff]"
                >
                  Fermer
                </button>
              </div>

              <form key={formKey} action={saveFormAction} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  <input type="hidden" name="contact_id" value={draft.id} />
                  <input type="hidden" name="contact_kind" value={draft.kind} />
                  <input type="hidden" name="entity_type" value={draft.entityType} />

                  <div>
                    <p className="text-sm font-semibold text-foreground">Que voulez-vous ajouter ?</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <SegmentButton
                        active={draft.kind === "client"}
                        label="Client"
                        description="Contact commercial"
                        disabled={isEditing}
                        onClick={() => setDraft((current) => ({ ...current, kind: "client", entityType: defaultEntityType("client") }))}
                      />
                      <SegmentButton
                        active={draft.kind === "supplier"}
                        label="Fournisseur"
                        description="Partenaire d'achat"
                        disabled={isEditing}
                        onClick={() =>
                          setDraft((current) => ({ ...current, kind: "supplier", entityType: defaultEntityType("supplier") }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Type de {kindLabel(draft.kind).toLowerCase()}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <SegmentButton
                        active={draft.entityType === "company"}
                        label="Entreprise"
                        description="Societe ou structure"
                        onClick={() => setDraft((current) => ({ ...current, entityType: "company" }))}
                      />
                      <SegmentButton
                        active={draft.entityType === "individual"}
                        label="Particulier"
                        description="Personne physique"
                        onClick={() => setDraft((current) => ({ ...current, entityType: "individual" }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-[#fbfcfd] p-4">
                    <div className="grid gap-4">
                      <FormField label={nameLabel}>
                        <Input name="name" required placeholder={namePlaceholder} defaultValue={draft.name} />
                      </FormField>

                      <FormField label="ICE">
                        <Input name="ice_number" placeholder="Identifiant Commun" defaultValue={draft.iceNumber} />
                      </FormField>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <FormField label="Personne de contact">
                      <Input
                        name="contact_name"
                        placeholder={draft.entityType === "company" ? "Ex: M. Responsable" : "Optionnel"}
                        defaultValue={draft.contactName}
                      />
                    </FormField>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Telephone">
                        <Input name="phone" type="tel" defaultValue={draft.phone} />
                      </FormField>

                      <FormField label="Email">
                        <Input name="email" type="email" defaultValue={draft.email} />
                      </FormField>
                    </div>

                    <FormField label="Adresse complete">
                      <Textarea name="address" placeholder="Adresse, ville, quartier..." defaultValue={draft.address} />
                    </FormField>

                    <FormField label="Note interne">
                      <Textarea
                        name="notes"
                        placeholder={
                          draft.kind === "client"
                            ? "Conditions de paiement, precision utile, remarque..."
                            : "Infos utiles sur les delais, conditions, contact..."
                        }
                        defaultValue={draft.notes}
                      />
                    </FormField>
                  </div>

                  {saveState.error ? (
                    <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{saveState.error}</div>
                  ) : null}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                    Annuler
                  </Button>
                  <SubmitButton className="px-6" pendingLabel="Enregistrement...">
                    {submitLabel}
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
