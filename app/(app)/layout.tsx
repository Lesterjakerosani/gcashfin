import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutShell } from "@/components/layout/LayoutShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  // Admins go to the admin panel
  if ((session.user as any).role === "admin") redirect("/admin/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { securityQuestion: true },
  });

  if (!user?.securityQuestion) {
    redirect("/auth/setup-security");
  }

  return <LayoutShell user={session.user}>{children}</LayoutShell>;
}
