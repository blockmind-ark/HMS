import { PrismaClient } from "@prisma/client";
import { HOSPITAL_INVENTORY_45_ITEMS } from "./seed-inventory-data";

const prisma = new PrismaClient();

export async function seedInventoryPurchases(client: PrismaClient = prisma) {
  console.log("Seeding 45 Medical Inventory Purchase Sheet records...");

  // Clean existing inventory purchases
  await client.inventoryPurchase.deleteMany();

  let count = 0;
  for (const item of HOSPITAL_INVENTORY_45_ITEMS) {
    const qtyPurchased = item.pkgPacks * item.nosPerPack;
    const totalCost = item.pkgPacks * item.perPackCost;
    const perUnitCost = Number((item.perPackCost / item.nosPerPack).toFixed(2));
    const totalValue = qtyPurchased * item.perUnitSellingPrice;

    await client.inventoryPurchase.create({
      data: {
        itemName: item.itemName,
        specification: item.specification,
        pkgPacks: item.pkgPacks,
        nosPerPack: item.nosPerPack,
        totalCost,
        perUnitCost,
        perPackCost: item.perPackCost,
        totalValue,
        perUnitSellingPrice: item.perUnitSellingPrice,
        qtyPurchased,
        batchNo: item.batchNo,
        expiryDate: new Date(item.expiryDate),
        isCredit: item.isCredit,
      },
    });
    count++;
  }

  console.log(`✔ Successfully seeded ${count} medical inventory purchase items into database.`);
}

async function main() {
  await seedInventoryPurchases();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("Error seeding inventory purchases:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

