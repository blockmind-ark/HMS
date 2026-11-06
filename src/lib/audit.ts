import { prisma } from "@/lib/prisma";

export async function recordAuditLog({
  userId,
  action,
  details,
}: {
  userId: string;
  action: string;
  details: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

