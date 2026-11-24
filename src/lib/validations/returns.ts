import { z } from "zod";

export const ReturnItemSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  batchId: z.string().optional().nullable(),
  quantityReturned: z
    .number()
    .int("Quantity returned must be a whole number")
    .min(1, "Quantity returned must be at least 1"),
  unitPrice: z
    .number()
    .min(0, "Unit price cannot be negative"),
});

export const CreateMedicineReturnSchema = z.object({
  saleId: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  patientName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  reason: z.string().min(2, "Return reason must be at least 2 characters"),
  items: z.array(ReturnItemSchema).min(1, "At least one item must be returned"),
});

export type CreateMedicineReturnInput = z.infer<typeof CreateMedicineReturnSchema>;
