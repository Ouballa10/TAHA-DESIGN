import type { RoleSlug, UserContext } from "@/types/models";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";
import { adminUsersPath, salesReportsPath } from "@/lib/utils/routes";

export type PermissionKey =
  | "viewDashboard"
  | "viewCatalog"
  | "manageCatalog"
  | "manageCategories"
  | "manageContacts"
  | "recordSale"
  | "createStockEntry"
  | "adjustStock"
  | "viewStockHistory"
  | "viewLowStock"
  | "viewReports"
  | "manageUsers"
  | "manageSettings"
  | "uploadPhotos";

export type PermissionMap = Record<PermissionKey, boolean>;

const basePermissionsByRole: Record<RoleSlug, PermissionMap> = {
  admin: {
    viewDashboard: true,
    viewCatalog: true,
    manageCatalog: true,
    manageCategories: true,
    manageContacts: true,
    recordSale: true,
    createStockEntry: true,
    adjustStock: true,
    viewStockHistory: true,
    viewLowStock: true,
    viewReports: true,
    manageUsers: true,
    manageSettings: true,
    uploadPhotos: true,
  },
  manager: {
    viewDashboard: true,
    viewCatalog: true,
    manageCatalog: true,
    manageCategories: true,
    manageContacts: true,
    recordSale: true,
    createStockEntry: true,
    adjustStock: true,
    viewStockHistory: true,
    viewLowStock: true,
    viewReports: true,
    manageUsers: false,
    manageSettings: false,
    uploadPhotos: true,
  },
  worker: {
    viewDashboard: true,
    viewCatalog: true,
    manageCatalog: false,
    manageCategories: false,
    manageContacts: false,
    recordSale: true,
    createStockEntry: false,
    adjustStock: false,
    viewStockHistory: true,
    viewLowStock: true,
    viewReports: false,
    manageUsers: false,
    manageSettings: false,
    uploadPhotos: false,
  },
};

const roleLabels: Record<RoleSlug, string> = {
  admin: "Administrateur",
  manager: "Responsable",
  worker: "Employe",
};

export function getRoleLabel(role: RoleSlug, locale: AppLocale = defaultLocale) {
  return translate(locale, roleLabels[role]);
}

export function getRoleBadgeTone(role: RoleSlug) {
  if (role === "admin") {
    return "brand" as const;
  }

  if (role === "manager") {
    return "warning" as const;
  }

  return "success" as const;
}

export function getRolePermissions(input: {
  role: RoleSlug;
  can_record_stock_entries: boolean;
  can_adjust_stock: boolean;
}) {
  const permissions = { ...basePermissionsByRole[input.role] };

  if (input.role !== "admin") {
    permissions.adjustStock = input.can_adjust_stock;
  }

  if (input.role === "worker") {
    permissions.createStockEntry = input.can_record_stock_entries;
    permissions.uploadPhotos = input.can_record_stock_entries;
  }

  return permissions;
}

export function hasPermission(context: UserContext, permission: PermissionKey) {
  return context.permissions[permission];
}

const pathPermissions: Array<{
  href: string;
  permission?: PermissionKey;
}> = [
  { href: "/dashboard", permission: "viewDashboard" },
  { href: "/contacts", permission: "manageContacts" },
  { href: "/clients", permission: "manageContacts" },
  { href: "/fournisseurs", permission: "manageContacts" },
  { href: "/produits", permission: "viewCatalog" },
  { href: "/categories", permission: "manageCategories" },
  { href: "/recherche", permission: "viewCatalog" },
  { href: "/stock/nouvelle-entree", permission: "createStockEntry" },
  { href: "/stock/mouvements", permission: "viewStockHistory" },
  { href: "/stock/alertes", permission: "viewLowStock" },
  { href: "/ventes", permission: "recordSale" },
  { href: salesReportsPath(), permission: "viewReports" },
  { href: adminUsersPath(), permission: "manageUsers" },
  { href: "/utilisateurs", permission: "manageUsers" },
  { href: "/profil" },
  { href: "/parametres", permission: "manageSettings" },
];

export function canAccessPath(context: UserContext, pathname: string) {
  const match = pathPermissions.find((item) => pathname.startsWith(item.href));

  if (!match?.permission) {
    return true;
  }

  return hasPermission(context, match.permission);
}

const navigationSourceItems = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    description: "Vue d'ensemble et chiffres du jour",
  },
  {
    href: "/ventes/nouvelle",
    label: "Nouvelle vente",
    description: "Saisie rapide depuis le telephone",
  },
  {
    href: "/ventes",
    label: "Historique ventes",
    description: "Tickets, clients et paiements",
  },
  {
    href: "/recherche",
    label: "Recherche rapide",
    description: "Reference, nom, categorie et couleur",
  },
  {
    href: "/contacts",
    label: "Clients & Fournisseurs",
    description: "Contacts commerciaux et fournisseurs",
  },
  {
    href: "/produits",
    label: "Produits & Services",
    description: "Articles, references et photos",
  },
  {
    href: "/categories",
    label: "Categories",
    description: "Organisation du catalogue",
  },
  {
    href: "/stock/nouvelle-entree",
    label: "Nouvelle entree",
    description: "Reception de marchandise",
  },
  {
    href: "/stock/mouvements",
    label: "Historique stock",
    description: "Entrees, sorties et corrections",
  },
  {
    href: "/stock/alertes",
    label: "Alertes stock",
    description: "Articles a reapprovisionner",
  },
  {
    href: salesReportsPath(),
    label: "Statistiques ventes",
    description: "Periodes, export Excel et analyses",
  },
  {
    href: adminUsersPath(),
    label: "Utilisateurs",
    description: "Comptes, roles et autorisations",
  },
  {
    href: "/profil",
    label: "Mon compte",
    description: "Coordonnees et securite",
  },
  {
    href: "/parametres",
    label: "Parametres",
    description: "Configuration du magasin",
  },
] as const;

export function getNavigationItems(locale: AppLocale = defaultLocale) {
  return navigationSourceItems.map((item) => ({
    ...item,
    label: translate(locale, item.label),
    description: translate(locale, item.description),
  }));
}

const mobileNavigationSourceItems = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/ventes/nouvelle", label: "Vente" },
  { href: "/recherche", label: "Recherche" },
  { href: "/stock/nouvelle-entree", label: "Entree" },
] as const;

export function getMobileNavigationItems(locale: AppLocale = defaultLocale) {
  return mobileNavigationSourceItems.map((item) => ({
    ...item,
    label: translate(locale, item.label),
  }));
}
