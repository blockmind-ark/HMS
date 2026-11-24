import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        specialization: true,
        phone: true,
        email: true,
        payType: true,
        baseSalary: true,
        perPatientShare: true,
      },
    });

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error("Failed to fetch active doctors:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load doctors list" },
      { status: 500 }
    );
  }
}
