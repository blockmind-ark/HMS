import { PrismaClient, ApprovalStatus } from "@prisma/client";

export function getSurgicalCategory(itemName: string, spec: string): string {
  const text = `${itemName} ${spec}`.toLowerCase();
  if (text.includes("cannula") || text.includes("stopcock")) return "IV Cannulas";
  if (text.includes("syringe") || (text.includes("needle") && !text.includes("spinal"))) return "Syringes & Needles";
  if (
    text.includes("dextrose") ||
    text.includes("saline") ||
    text.includes("ringer") ||
    text.includes("infusion set") ||
    text.includes("giving set")
  ) {
    return "IV Infusions & Fluids";
  }
  if (
    text.includes("suture") ||
    text.includes("silk") ||
    text.includes("vicryl") ||
    text.includes("prolene") ||
    text.includes("blade") ||
    text.includes("scalpel")
  ) {
    return "Sutures & Blades";
  }
  if (text.includes("catheter") || text.includes("urine") || text.includes("foley") || text.includes("drainage")) {
    return "Catheters & Drainage";
  }
  if (text.includes("glove")) return "Gloves & Protection";
  if (
    text.includes("bandage") ||
    text.includes("cotton") ||
    text.includes("gauze") ||
    text.includes("tape") ||
    text.includes("swab")
  ) {
    return "Bandages & Dressings";
  }
  return "Surgical Disposables";
}

export function getMedicineCategory(itemName: string, spec: string): string {
  const text = `${itemName} ${spec}`.toLowerCase();
  if (text.includes("tab") || text.includes("cap") || text.includes("tablet") || text.includes("capsule")) {
    return "Tablets & Capsules";
  }
  if (
    text.includes("susp") ||
    text.includes("syrup") ||
    text.includes("120ml") ||
    text.includes("60ml") ||
    text.includes("liquid") ||
    text.includes("elixir") ||
    text.includes("solution")
  ) {
    return "Syrups & Suspensions";
  }
  if (text.includes("inj") || text.includes("ampoule") || text.includes("infusion") || text.includes("vial")) {
    return "Injections & Ampoules";
  }
  if (text.includes("cream") || text.includes("gel") || text.includes("ointment") || text.includes("lotion")) {
    return "Creams & Ointments";
  }
  if (text.includes("inhaler") || text.includes("resp") || text.includes("nebul")) {
    return "Inhalers & Respiratory";
  }
  if (text.includes("sachet") || text.includes("powder")) {
    return "Sachets & Nutritional";
  }
  if (text.includes("drop")) return "Eye & Ear Drops";
  return "General Medicines";
}

export async function syncPosCatalogFromInventory(prisma: PrismaClient) {
  console.log("================================================================================");
  console.log("   SYNCING POS BILLING & DISPENSARY CATALOG (MEDICINES + SURGICAL)");
  console.log("================================================================================");

  // 1. Fetch all 45 surgical inventory items
  const surgicalItems = await prisma.inventoryPurchase.findMany({
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${surgicalItems.length} items in InventoryPurchase.`);

  // 2. Fetch all 289 medicines from MedicineInventory
  const medicineItems = await prisma.medicineInventory.findMany({
    orderBy: { sNo: "asc" },
  });
  console.log(`Found ${medicineItems.length} items in MedicineInventory.`);

  let surgicalCount = 0;
  for (const item of surgicalItems) {
    const category = getSurgicalCategory(item.itemName, item.specification);

    // Find or create Medicine entry with itemType = "SURGICAL"
    let med = await prisma.medicine.findFirst({
      where: {
        name: item.itemName,
        genericName: item.specification,
      },
    });

    if (!med) {
      med = await prisma.medicine.create({
        data: {
          name: item.itemName,
          genericName: item.specification,
          category,
          itemType: "SURGICAL",
          threshold: 15,
        },
      });
    } else {
      await prisma.medicine.update({
        where: { id: med.id },
        data: {
          category,
          itemType: "SURGICAL",
        },
      });
    }

    // Find or create StockBatch for this surgical item
    const existingBatch = await prisma.stockBatch.findFirst({
      where: {
        medicineId: med.id,
        batchNumber: item.batchNo,
      },
    });

    if (!existingBatch) {
      const mfgDate = new Date(item.expiryDate);
      mfgDate.setFullYear(mfgDate.getFullYear() - 2);

      await prisma.stockBatch.create({
        data: {
          medicineId: med.id,
          batchNumber: item.batchNo,
          quantity: item.qtyPurchased,
          purchasePrice: item.perUnitCost,
          sellingPrice: item.perUnitSellingPrice,
          mfgDate,
          expiryDate: new Date(item.expiryDate),
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });
    } else {
      await prisma.stockBatch.update({
        where: { id: existingBatch.id },
        data: {
          quantity: item.qtyPurchased,
          purchasePrice: item.perUnitCost,
          sellingPrice: item.perUnitSellingPrice,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });
    }

    surgicalCount++;
  }
  console.log(`✔ Synced ${surgicalCount} Surgical & Consumables into POS Catalog.`);

  // 3. Sync all 289 Medicines into POS Catalog
  let medCount = 0;
  for (const item of medicineItems) {
    const category = getMedicineCategory(item.itemName, item.formPotencySpec);

    // Find or create Medicine entry with itemType = "MEDICINE"
    let med = await prisma.medicine.findFirst({
      where: {
        name: item.itemName,
        genericName: item.formPotencySpec,
      },
    });

    if (!med) {
      med = await prisma.medicine.create({
        data: {
          name: item.itemName,
          genericName: item.formPotencySpec,
          category,
          itemType: "MEDICINE",
          threshold: 25,
        },
      });
    } else {
      await prisma.medicine.update({
        where: { id: med.id },
        data: {
          category,
          itemType: "MEDICINE",
        },
      });
    }

    // Find or create StockBatch for this medicine
    const existingBatch = await prisma.stockBatch.findFirst({
      where: {
        medicineId: med.id,
        batchNumber: item.batchNo,
      },
    });

    if (!existingBatch) {
      const mfgDate = new Date(item.expiryDate);
      mfgDate.setFullYear(mfgDate.getFullYear() - 2);

      await prisma.stockBatch.create({
        data: {
          medicineId: med.id,
          batchNumber: item.batchNo,
          quantity: item.qtyPurchased,
          purchasePrice: item.perUnitCost,
          sellingPrice: item.perUnitSelling,
          mfgDate,
          expiryDate: new Date(item.expiryDate),
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });
    } else {
      await prisma.stockBatch.update({
        where: { id: existingBatch.id },
        data: {
          quantity: item.qtyPurchased,
          purchasePrice: item.perUnitCost,
          sellingPrice: item.perUnitSelling,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });
    }

    medCount++;
  }
  console.log(`✔ Synced ${medCount} Hospital & Pharmacy Medicines into POS Catalog.`);

  const totalCatalog = await prisma.medicine.count();
  const totalBatches = await prisma.stockBatch.count({
    where: { approvalStatus: ApprovalStatus.APPROVED, quantity: { gt: 0 } },
  });
  console.log(`\n🎉 Total POS Dispensary Catalog items: ${totalCatalog} | Active Batches: ${totalBatches}`);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await syncPosCatalogFromInventory(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
}

