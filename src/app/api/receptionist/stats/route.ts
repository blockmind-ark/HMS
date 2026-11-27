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
      select: { serviceType: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: todayStart },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const todayRevenue = todayInvoices._sum.totalAmount ?? 0;
  const totalRevenue = allInvoices._sum.totalAmount ?? 0;

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

