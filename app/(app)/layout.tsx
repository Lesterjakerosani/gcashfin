import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80')] bg-cover bg-center opacity-[0.06] -z-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[rgba(40,10,10,0.92)] to-[#0a0a0a] -z-10" />
      <Navbar user={session?.user} />
      <main className="max-w-[1600px] mx-auto px-7 py-6">{children}</main>
    </div>
  );
}
