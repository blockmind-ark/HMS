import { prisma } from "./prisma";

export function getTodayDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface GeneratedTokenResult {
  id: string;
  tokenNumber: number;
  tokenType: "MANUAL_RESERVED" | "AUTO_SEQUENCE";
  status: "ISSUED" | "CANCELLED";
  dateStr: string;
  patientId?: string | null;
  fee?: number;
  services?: { id: string; name: string; fee: number }[] | any;
  createdAt: Date;
  issuedBy: {
    id: string;
    name: string;
    role: string;
  };
  patient?: {
    id: string;
    name: string;
    patientUid: string;
    phone: string;
    age?: number;
    gender?: string;
    cnic?: string | null;
  } | null;
}

export async function generateOpdToken(
  userId: string,
  type: "AUTO" | "MANUAL",
  manualNum?: number,
  patientId?: string,
  services?: { id: string; name: string; fee: number }[],
  fee?: number
): Promise<GeneratedTokenResult> {
  const dateStr = getTodayDateStr();

  const tokenLog = await prisma.$transaction(async (tx) => {
    // 1. Ensure counter row exists for today (starts with lastAutoNumber = 4)
    let counter = await tx.dailyTokenCounter.findUnique({
      where: { dateStr },
    });

    if (!counter) {
      try {
        counter = await tx.dailyTokenCounter.create({
          data: {
            dateStr,
            lastAutoNumber: 4,
            issuedManualTokens: [],
          },
        });
      } catch (e) {
        // In case of parallel request race during first initialization
        counter = await tx.dailyTokenCounter.findUniqueOrThrow({
          where: { dateStr },
        });
      }
    }

    // 2. Acquire PostgreSQL row-level lock FOR UPDATE on today's counter
    const lockedRows: any[] = await tx.$queryRaw`
      SELECT id, "dateStr", "lastAutoNumber", "issuedManualTokens"
      FROM "DailyTokenCounter"
      WHERE "dateStr" = ${dateStr}
      FOR UPDATE
    `;

    const currentCounter = lockedRows?.[0] || counter;
    const currentLastAuto: number = currentCounter.lastAutoNumber;
    const issuedManual: number[] = currentCounter.issuedManualTokens || [];

    let tokenNum: number;
    let tokenType: "MANUAL_RESERVED" | "AUTO_SEQUENCE";

    if (type === "MANUAL") {
      if (!manualNum || manualNum < 1 || manualNum > 4) {
        throw new Error("Invalid manual token number. Reserved slots are 1 to 4.");
      }

      if (issuedManual.includes(manualNum)) {
        throw new Error("Token already issued today");
      }

      // Secondary check in DailyTokenLog for today
      const existingLog = await tx.dailyTokenLog.findFirst({
        where: {
          dateStr,
          tokenNumber: manualNum,
          status: "ISSUED",
        },
      });

      if (existingLog) {
        throw new Error("Token already issued today");
      }

      tokenNum = manualNum;
      tokenType = "MANUAL_RESERVED";
      const updatedManuals = Array.from(new Set([...issuedManual, manualNum])).sort((a, b) => a - b);

      await tx.dailyTokenCounter.update({
        where: { dateStr },
        data: {
          issuedManualTokens: updatedManuals,
        },
      });
    } else {
      // AUTO_SEQUENCE: Starts at 5 (lastAutoNumber = 4 + 1 = 5) on a new day
      tokenNum = currentLastAuto + 1;
      tokenType = "AUTO_SEQUENCE";

      await tx.dailyTokenCounter.update({
        where: { dateStr },
        data: {
          lastAutoNumber: tokenNum,
        },
      });
    }

    // 3. Record in DailyTokenLog
    const calculatedFee =
      fee !== undefined
        ? fee
        : services && services.length > 0
        ? services.reduce((acc, s) => acc + s.fee, 0)
        : 300;
    const finalServices =
      services && services.length > 0
        ? services
        : [{ id: "opd", name: "OPD Fees", fee: 300 }];

    const log = await tx.dailyTokenLog.create({
      data: {
        dateStr,
        tokenNumber: tokenNum,
        tokenType,
        status: "ISSUED",
        issuedById: userId,
        patientId: patientId || null,
        fee: calculatedFee,
        services: finalServices,
      },
      include: {
        issuedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientUid: true,
            phone: true,
            age: true,
            gender: true,
            cnic: true,
          },
        },
      },
    });

    return log;
  });

  return tokenLog as unknown as GeneratedTokenResult;
}

export async function getTodayTokenStatus() {
  const dateStr = getTodayDateStr();

  // Find or create today's counter
  let counter = await prisma.dailyTokenCounter.findUnique({
    where: { dateStr },
  });

  if (!counter) {
    try {
      counter = await prisma.dailyTokenCounter.create({
        data: {
          dateStr,
          lastAutoNumber: 4,
          issuedManualTokens: [],
        },
      });
    } catch {
      counter = await prisma.dailyTokenCounter.findUnique({
        where: { dateStr },
      });
    }
  }

  const [recentLogs, totalCount, autoCount, manualCount] = await Promise.all([
    prisma.dailyTokenLog.findMany({
      where: { dateStr, status: "ISSUED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        issuedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientUid: true,
            phone: true,
            age: true,
            gender: true,
            cnic: true,
          },
        },
      },
    }),
    prisma.dailyTokenLog.count({
      where: { dateStr, status: "ISSUED" },
    }),
    prisma.dailyTokenLog.count({
      where: { dateStr, status: "ISSUED", tokenType: "AUTO_SEQUENCE" },
    }),
    prisma.dailyTokenLog.count({
      where: { dateStr, status: "ISSUED", tokenType: "MANUAL_RESERVED" },
    }),
  ]);

  return {
    dateStr,
    counter: {
      lastAutoNumber: counter?.lastAutoNumber ?? 4,
      nextAutoToken: (counter?.lastAutoNumber ?? 4) + 1,
      issuedManualTokens: counter?.issuedManualTokens ?? [],
    },
    stats: {
      totalToday: totalCount,
      autoCount,
      manualCount,
    },
    recentTokens: recentLogs,
  };
}
