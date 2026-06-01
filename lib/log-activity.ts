import { prisma } from "./prisma";

export async function logActivity(data: {
  userId?: string;
  userName: string;
  userEmail: string;
  action: string;
  details?: string;
}) {
  await prisma.activityLog.create({ data }).catch(() => {});
}
