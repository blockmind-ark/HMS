import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalPatients, todayVisits, allInvoices, todayInvoices] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.findMany({
      where: {
        createdAt: { gte: todayStart },
      },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID" },
    }),
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: todayStart },
      },
    }),
  ]);

  const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const opdCount = todayVisits.filter((v) =>
    v.serviceType.toLowerCase().includes("opd")
  ).length;

  const ultrasoundCount = todayVisits.filter((v) =>
    v.serviceType.toLowerCase().includes("ultrasound")
  ).length;

  const otherCount = todayVisits.length - opdCount - ultrasoundCount;

  return NextResponse.json({
    totalPatients,
    todayVisitsCount: todayVisits.length,
    todayRevenue,
    totalRevenue,
    breakdown: {
      opd: opdCount,
      ultrasound: ultrasoundCount,
      other: otherCount,
    },
  });
}

