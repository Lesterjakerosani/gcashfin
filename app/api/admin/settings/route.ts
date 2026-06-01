import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

function isAdmin(s: any) { return s?.user?.role === "admin"; }

const DEFAULTS: Record<string, string> = {
  siteName: "GCashFin",
  siteDescription: "Real-time GCash account monitoring & transaction management",
  contactEmail: "admin@gmail.com",
  maintenanceMode: "false",
  primaryColor: "#10B981",
  allowRegistration: "true",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  rows.forEach(r => { map[r.key] = r.value; });
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  await logActivity({ userName: session!.user!.name || "Admin", userEmail: session!.user!.email || "", action: "Updated system settings" });
  return NextResponse.json({ ok: true });
}
