import { redirect } from "next/navigation";
import { getPostAuthRedirectPath } from "@/lib/auth-routing";

export default async function DashboardIndexPage() {
  redirect(await getPostAuthRedirectPath());
}
