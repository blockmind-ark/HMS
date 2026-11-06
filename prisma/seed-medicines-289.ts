import { PrismaClient } from "@prisma/client";
import { RAW_ITEMS_289, parseMedicineLine } from "./seed-medicines-289-data";

export async function seed289Medicines(prisma: PrismaClient) {
  console.log("Beginning seed of 289 Medicines into MedicineInventory...");

  const existingCount = await prisma.medicineInventory.count();
  if (existingCount >= 289) {
    console.log(`MedicineInventory already contains ${existingCount} items. Skipping seed.`);
    return;
  }

  // Clear existing items if any to maintain exact 1..289 sNo sequence
  if (existingCount > 0) {
    await prisma.medicineInventory.deleteMany();
  }

  const records = RAW_ITEMS_289.map(parseMedicineLine);

  // Batch insert into database
  await prisma.medicineInventory.createMany({
    data: records,
  });

  console.log(`Successfully seeded all ${records.length} medicines into MedicineInventory!`);
}

export const seed289MedicinesTs = seed289Medicines;
