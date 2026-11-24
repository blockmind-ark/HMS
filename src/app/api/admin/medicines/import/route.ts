import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { parseCSV, detectHeaders } from "@/lib/csv-parser";
import { resolveMedicineCategory } from "@/lib/medicine-category";

interface RowValidationError {
  rowNumber: number;
  itemName: string;
  errors: string[];
}

/**
 * Scans text for unauthorized or forbidden special characters.
 * Allowed in medical inventory:
 * - Alphanumeric: a-z, A-Z, 0-9
 * - Spaces
 * - Standard pharmaceutical symbols: - . / % ( ) + & ' ,
 */
function getForbiddenSpecialChars(text: string): string[] {
  const forbidden = new Set<string>();
  for (const ch of text) {
    if (!/[a-zA-Z0-9\s\-./%()+&',]/.test(ch)) {
      forbidden.add(ch);
    }
  }
  return Array.from(forbidden);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No CSV file uploaded. Please select a valid .csv file." },
        { status: 400 }
      );
    }

    const fileName = file.name || "upload.csv";
    if (!fileName.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV files (.csv) are accepted." },
        { status: 400 }
      );
    }

    // 1. NON-EMPTY CHECK
    const text = await file.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Non-Empty Check Failed: The uploaded CSV file is empty. Please upload a CSV file with valid data rows." },
        { status: 400 }
      );
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json(
        {
          error:
            "Non-Empty Check Failed: The CSV file must contain a header row and at least one data row beneath the header.",
        },
        { status: 400 }
      );
    }

    // Ensure there are non-empty data rows beneath the header
    const dataRowsWithIndex = rows
      .slice(1)
      .map((row, idx) => ({ row, rowNumber: idx + 2 }))
      .filter(({ row }) => row.some((c) => c && c.trim().length > 0));

    if (dataRowsWithIndex.length === 0) {
      return NextResponse.json(
        {
          error:
            "Non-Empty Check Failed: The CSV file contains no valid data rows beneath the header.",
        },
        { status: 400 }
      );
    }

    // 2. COLUMN COMPLETENESS CHECK
    const rawHeaders = rows[0];
    const { mapping, missingRequired } = detectHeaders(rawHeaders);

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Column Completeness Check Failed",
          missingHeaders: missingRequired,
          detectedHeaders: rawHeaders,
          message: `Column Completeness Check Failed: The uploaded CSV is missing mandatory column header(s): ${missingRequired.join(
            ", "
          )}. All mandatory columns must be strictly present.`,
        },
        { status: 400 }
      );
    }

    const validationErrors: RowValidationError[] = [];

    interface ValidatedRow {
      rowNumber: number;
      name: string;
      specification: string;
      category: string;
      sellingPrice: number;
      quantity: number;
      purchasePrice: number;
      threshold: number;
      perOff: number;
      batchNo: string;
      expiryDate: Date;
      isCredit: boolean;
    }

    const validatedItems: ValidatedRow[] = [];

    // 3, 4, 5. ROW-BY-ROW VALIDATION (Data Type, Special Character, No Duplicate Restrictions)
    dataRowsWithIndex.forEach(({ row, rowNumber }) => {
      const rowErrors: string[] = [];

      const rawName = (row[mapping.nameIdx] ?? "").trim();
      const rawCategory = (row[mapping.categoryIdx] ?? "").trim();
      const rawSelling = (row[mapping.sellingPriceIdx] ?? "").trim();
      const rawQty = (row[mapping.quantityIdx] ?? "").trim();
      const rawPurchase =
        mapping.purchasePriceIdx !== -1
          ? (row[mapping.purchasePriceIdx] ?? "").trim()
          : "";
      const rawThreshold =
        mapping.thresholdIdx !== -1
          ? (row[mapping.thresholdIdx] ?? "").trim()
          : "";
      const rawPerOff =
        mapping.perOffIdx !== -1
          ? (row[mapping.perOffIdx] ?? "").trim()
          : "";
      const rawBatchNo =
        mapping.batchNoIdx !== -1
          ? (row[mapping.batchNoIdx] ?? "").trim()
          : "";
      const rawExpiry =
        mapping.expiryDateIdx !== -1
          ? (row[mapping.expiryDateIdx] ?? "").trim()
          : "";
      const rawCredit =
        mapping.creditStatusIdx !== -1
          ? (row[mapping.creditStatusIdx] ?? "").trim()
          : "";

      // 4. SPECIAL CHARACTER RESTRICTIONS (Name & Category)
      if (!rawName) {
        rowErrors.push("Medicine Name cannot be empty.");
      } else {
        const forbiddenInName = getForbiddenSpecialChars(rawName);
        if (forbiddenInName.length > 0) {
          rowErrors.push(
            `Medicine Name contains unauthorized or forbidden special character(s): ${forbiddenInName
              .map((c) => `'${c}'`)
              .join(", ")}. Allowed characters: letters, numbers, spaces, and: - . / % ( ) + & ' ,`
          );
        }
      }

      if (rawCategory) {
        const forbiddenInCat = getForbiddenSpecialChars(rawCategory);
        if (forbiddenInCat.length > 0) {
          rowErrors.push(
            `Category / Specification contains unauthorized or forbidden special character(s): ${forbiddenInCat
              .map((c) => `'${c}'`)
              .join(", ")}. Allowed characters: letters, numbers, spaces, and: - . / % ( ) + & ' ,`
          );
        }
      }

      if (rawBatchNo) {
        const forbiddenInBatch = getForbiddenSpecialChars(rawBatchNo);
        if (forbiddenInBatch.length > 0) {
          rowErrors.push(
            `Batch Number contains unauthorized or forbidden special character(s): ${forbiddenInBatch
              .map((c) => `'${c}'`)
              .join(", ")}.`
          );
        }
      }

      // 3. DATA TYPE VALIDATION: Numerical Fields
      // Validate Selling Price
      const cleanSelling = rawSelling.replace(/^(rs\.?|\$)\s*/i, "").replace(/,/g, "").trim();
      const parsedSelling = cleanSelling !== "" ? Number(cleanSelling) : NaN;
      if (cleanSelling === "" || isNaN(parsedSelling)) {
        rowErrors.push(
          `Selling Price must be a valid numeric data type (e.g. 25.00), received '${rawSelling}'.`
        );
      } else if (parsedSelling < 0) {
        rowErrors.push(
          `Selling Price cannot be negative, received '${rawSelling}'.`
        );
      }

      // Validate Quantity (QTY)
      const cleanQty = rawQty.replace(/,/g, "").trim();
      const parsedQty = cleanQty !== "" ? Number(cleanQty) : NaN;
      if (cleanQty === "" || isNaN(parsedQty) || !Number.isInteger(parsedQty)) {
        rowErrors.push(
          `Quantity (QTY) must be a valid whole integer numeric data type (e.g. 100), received '${rawQty}'.`
        );
      } else if (parsedQty < 0) {
        rowErrors.push(
          `Quantity (QTY) cannot be negative, received '${rawQty}'.`
        );
      }

      // Validate Purchase Price (optional numeric)
      let parsedPurchase = 0;
      if (rawPurchase) {
        const cleanPurchase = rawPurchase.replace(/^(rs\.?|\$)\s*/i, "").replace(/,/g, "").trim();
        parsedPurchase = cleanPurchase !== "" ? Number(cleanPurchase) : NaN;
        if (isNaN(parsedPurchase)) {
          rowErrors.push(
            `Purchase Price must be a valid numeric data type, received '${rawPurchase}'.`
          );
        } else if (parsedPurchase < 0) {
          rowErrors.push(
            `Purchase Price cannot be negative, received '${rawPurchase}'.`
          );
        }
      } else {
        parsedPurchase = !isNaN(parsedSelling)
          ? Number((parsedSelling * 0.8).toFixed(2))
          : 0;
      }

      // Validate Alert Threshold (optional integer)
      let parsedThreshold = 10;
      if (rawThreshold) {
        const cleanThresh = rawThreshold.replace(/,/g, "").trim();
        const numThresh = cleanThresh !== "" ? Number(cleanThresh) : NaN;
        if (isNaN(numThresh) || !Number.isInteger(numThresh) || numThresh < 0) {
          rowErrors.push(
            `Alert Threshold must be a valid non-negative whole integer numeric data type, received '${rawThreshold}'.`
          );
        } else {
          parsedThreshold = numThresh;
        }
      }

      // Validate Per-Off discount rate (optional numeric 0-100)
      let parsedPerOff = 0;
      if (rawPerOff) {
        const cleanPerOff = rawPerOff.replace(/%/g, "").trim();
        const numPerOff = cleanPerOff !== "" ? Number(cleanPerOff) : NaN;
        if (isNaN(numPerOff) || numPerOff < 0 || numPerOff > 100) {
          rowErrors.push(
            `Per-Off discount must be a valid numeric percentage between 0 and 100, received '${rawPerOff}'.`
          );
        } else {
          parsedPerOff = numPerOff;
        }
      }

      // Validate Expiry Date (optional date format)
      let parsedExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      if (rawExpiry) {
        const expDate = new Date(rawExpiry);
        if (isNaN(expDate.getTime())) {
          rowErrors.push(
            `Expiry Date must be a valid date format (e.g. YYYY-MM-DD or DD-Mon-YYYY), received '${rawExpiry}'.`
          );
        } else {
          parsedExpiry = expDate;
        }
      }

      // Credit Status
      const isCredit =
        rawCredit.toLowerCase() === "credit" ||
        rawCredit.toLowerCase() === "true" ||
        rawCredit.toLowerCase() === "yes";

      // Note: POLICY 5: NO DUPLICATE RESTRICTIONS - Duplicates are allowed and not blocked.

      if (rowErrors.length > 0) {
        validationErrors.push({
          rowNumber,
          itemName: rawName || `Row #${rowNumber}`,
          errors: rowErrors,
        });
      } else {
        const category = resolveMedicineCategory(
          rawName,
          rawCategory,
          rawCategory
        );

        validatedItems.push({
          rowNumber,
          name: rawName,
          specification: rawCategory || "Standard",
          category,
          sellingPrice: parsedSelling,
          quantity: parsedQty,
          purchasePrice: parsedPurchase,
          threshold: parsedThreshold,
          perOff: parsedPerOff,
          batchNo: rawBatchNo.toUpperCase() || `BATCH-${Date.now().toString().slice(-6)}`,
          expiryDate: parsedExpiry,
          isCredit,
        });
      }
    });

    // If validation fails, halt import and return detailed row-by-row error report
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV Validation Failed",
          totalRows: dataRowsWithIndex.length,
          invalidRowsCount: validationErrors.length,
          validRowsCount: validatedItems.length,
          errors: validationErrors,
          message: `Validation failed: Found ${validationErrors.length} invalid row(s) out of ${dataRowsWithIndex.length}. No records have been imported. Please correct the reported issues and re-upload.`,
        },
        { status: 422 }
      );
    }

    // 5. IMPORT EXECUTION (All checks passed; duplicate entries are fully permitted)
    let importedCount = 0;

    // Get max S.No for MedicineInventory auto-indexing
    const lastInventoryItem = await prisma.medicineInventory.findFirst({
      orderBy: { sNo: "desc" },
      select: { sNo: true },
    });
    let currentSNo = (lastInventoryItem?.sNo || 0) + 1;

    for (const item of validatedItems) {
      // 5a. Find or create Medicine catalog entry
      const existingMed = await prisma.medicine.findFirst({
        where: { name: { equals: item.name, mode: "insensitive" } },
      });

      let medId: string;
      if (existingMed) {
        medId = existingMed.id;
        await prisma.medicine.update({
          where: { id: medId },
          data: {
            genericName: item.specification,
            category: item.category,
            threshold: item.threshold,
            perOff: item.perOff,
          },
        });
      } else {
        const createdMed = await prisma.medicine.create({
          data: {
            name: item.name,
            genericName: item.specification,
            category: item.category,
            itemType: "MEDICINE",
            threshold: item.threshold,
            perOff: item.perOff,
          },
        });
        medId = createdMed.id;
      }

      // 5b. Create StockBatch (duplicates permitted freely)
      const mfgDate = new Date(item.expiryDate);
      mfgDate.setFullYear(mfgDate.getFullYear() - 2);

      await prisma.stockBatch.create({
        data: {
          medicineId: medId,
          batchNumber: item.batchNo,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          perOff: item.perOff,
          mfgDate,
          expiryDate: item.expiryDate,
          approvalStatus: "APPROVED",
        },
      });

      // 5c. Insert MedicineInventory entry (duplicates permitted freely with sequential S.No)
      const totalCost = Number((item.quantity * item.purchasePrice).toFixed(2));
      const totalValue = Number((item.quantity * item.sellingPrice).toFixed(2));

      await prisma.medicineInventory.create({
        data: {
          sNo: currentSNo++,
          itemName: item.name,
          formPotencySpec: item.specification,
          pkgPacks: 1,
          nosPerPack: item.quantity || 1,
          totalCost,
          perUnitCost: item.purchasePrice,
          perPackCost: item.purchasePrice,
          totalValue,
          perUnitSelling: item.sellingPrice,
          qtyPurchased: item.quantity,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          isCredit: item.isCredit,
          threshold: item.threshold,
          perOff: item.perOff,
        },
      });

      importedCount++;
    }

    // Record Audit Log
    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_CSV_IMPORT",
      details: `${session.user.name} (${session.user.role}) validated and imported ${importedCount} medicine records from CSV file '${fileName}' under the strict validation & duplicate-tolerant policy.`,
    });

    return NextResponse.json({
      success: true,
      count: importedCount,
      message: `Successfully validated and imported ${importedCount} medicine record(s) into inventory and POS catalog.`,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and import CSV file." },
      { status: 500 }
    );
  }
}
