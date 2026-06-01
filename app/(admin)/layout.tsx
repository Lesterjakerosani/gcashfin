import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as any).role !== "admin") redirect("/dashboard");
  return <AdminShell user={session.user}>{children}</AdminShell>;
}
