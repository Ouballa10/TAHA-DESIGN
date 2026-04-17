import "server-only";

import { randomUUID } from "crypto";

export async function uploadImageIfNeeded({
  supabase,
  file,
  folder,
}: {
  supabase: any;
  file: FormDataEntryValue | null;
  folder: string;
}) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error("Impossible d'envoyer l'image.");
  }

  return path;
}
