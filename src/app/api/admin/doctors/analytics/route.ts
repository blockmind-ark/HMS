import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Start of current week (7 days ago)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Start of current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        specialization: true,
        baseSalary: true,
        perPatientShare: true,
        isActive: true,
      },
    });

    const analytics = await Promise.all(
      doctors.map(async (doc) => {
        // Daily visits (today)
        const dailyVisits = await prisma.visit.count({
          where: {
            doctorId: doc.id,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        });

        // Weekly visits (past 7 days)
        const weeklyVisits = await prisma.visit.count({
          where: {
            doctorId: doc.id,
            createdAt: { gte: sevenDaysAgo },
          },
        });

        // Yearly visits (current calendar year)
        const yearlyVisits = await prisma.visit.count({
          where: {
            doctorId: doc.id,
            createdAt: { gte: startOfYear },
          },
        });

        // Today tokens issued for this doctor
        const todayTokens = await prisma.dailyTokenLog.count({
          where: {
            doctorId: doc.id,
            dateStr: todayStr,
            status: "ISSUED",
          },
        });

        return {
          doctorId: doc.id,
          name: doc.name,
          specialization: doc.specialization,
          isActive: doc.isActive,
          metrics: {
            daily: dailyVisits,
            weekly: weeklyVisits,
            yearly: yearlyVisits,
            todayTokens,
          },
        };
      })
    );

    // Hospital aggregate totals
    const totalDaily = analytics.reduce((acc, a) => acc + a.metrics.daily, 0);
    const totalWeekly = analytics.reduce((acc, a) => acc + a.metrics.weekly, 0);
    const totalYearly = analytics.reduce((acc, a) => acc + a.metrics.yearly, 0);
    const totalTodayTokens = analytics.reduce((acc, a) => acc + a.metrics.todayTokens, 0);

    return NextResponse.json({
      success: true,
      todayStr,
      summary: {
        totalDaily,
        totalWeekly,
        totalYearly,
        totalTodayTokens,
      },
      doctors: analytics,
    });
  } catch (error: any) {
    console.error("Failed to fetch doctor visit analytics:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load visit analytics" },
      { status: 500 }
    );
  }
}
