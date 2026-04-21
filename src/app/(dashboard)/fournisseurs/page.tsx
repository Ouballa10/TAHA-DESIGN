import { redirect } from "next/navigation";

export default function SuppliersPage() {
  redirect("/contacts?type=supplier");
}
