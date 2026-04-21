import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ClientProfileItem, SupplierDirectoryItem } from "@/types/models";

export async function getClientProfiles(): Promise<ClientProfileItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, client_type, contact_name, ice_number, phone, email, address, notes, created_at")
    .order("name", { ascending: true });

  return (data ?? []) as ClientProfileItem[];
}

export async function getSupplierProfiles(): Promise<SupplierDirectoryItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, supplier_type, contact_name, ice_number, phone, email, address, notes, created_at")
    .order("name", { ascending: true });

  return (data ?? []) as SupplierDirectoryItem[];
}

export async function getContactsDirectory() {
  const [clients, suppliers] = await Promise.all([getClientProfiles(), getSupplierProfiles()]);

  return {
    clients,
    suppliers,
  };
}
