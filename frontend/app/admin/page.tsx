import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Login করা না থাকলে
  if (error || !user) {
    redirect("/admin/login");
  }

  // User email
  const userEmail = user.email?.trim().toLowerCase() ?? "";

  // .env.local থেকে authorized admin emails
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Authorized admin না হলে
  if (!adminEmails.includes(userEmail)) {
    redirect("/admin/login");
  }

  // Authorized admin হলে Dashboard দেখাবে
  return <AdminDashboard />;
}