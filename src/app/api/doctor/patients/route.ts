import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized access to Doctor Portal" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";

  try {
    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { patientUid: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { biometricHash: { contains: query, mode: "insensitive" } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            serviceType: true,
            createdAt: true,
            diagnosis: true,
          },
        },
        _count: {
          select: {
            visits: true,
            pharmacySales: true,
            invoices: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const formatted = patients.map((p) => ({
      id: p.id,
      patientUid: p.patientUid,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      biometricHash: p.biometricHash,
      createdAt: p.createdAt,
      totalVisits: p._count.visits,
      totalSales: p._count.pharmacySales,
      totalInvoices: p._count.invoices,
      lastVisit: p.visits[0] || null,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      patients: formatted,
    });
  } catch (error: any) {
    console.error("Doctor patients lookup failed:", error);
    return NextResponse.json({ error: "Failed to retrieve patients" }, { status: 500 });
  }
}

