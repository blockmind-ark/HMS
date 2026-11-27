import { z } from "zod";
import { penaltyPolicySchema } from "@/lib/doctor-penalties";

export const DoctorInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Doctor name must be at least 2 characters")
    .max(100, "Doctor name cannot exceed 100 characters"),
  specialization: z
    .string()
    .trim()
    .min(2, "Specialization must be at least 2 characters")
    .max(100, "Specialization cannot exceed 100 characters"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  baseSalary: z.coerce.number().min(0, "Base salary must be non-negative (>= 0)"),
  payType: z.enum(["MONTHLY", "PER_PATIENT", "DAILY"]).default("MONTHLY"),
  perPatientShare: z.coerce.number().min(0, "Per-patient share must be non-negative (>= 0)").default(0),
  userId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
  penaltyPolicy: penaltyPolicySchema.optional(),
});

export const DoctorUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  specialization: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  baseSalary: z.coerce.number().min(0).optional(),
  payType: z.enum(["MONTHLY", "PER_PATIENT", "DAILY"]).optional(),
  perPatientShare: z.coerce.number().min(0).optional(),
  userId: z.string().nullable().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  penaltyPolicy: penaltyPolicySchema.optional(),
});

export const DoctorAttendanceInputSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY", "OFF"]).default("PRESENT"),
  checkInTime: z.string().optional().or(z.literal("")),
  checkOutTime: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const DoctorLeaveInputSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().trim().min(2, "Reason must be at least 2 characters"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("APPROVED"),
  notes: z.string().optional().or(z.literal("")),
});

export const DoctorPayrollAdjustSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  year: z.coerce.number().int().min(2020).max(2050),
  month: z.coerce.number().int().min(1).max(12),
  basePay: z.coerce.number().min(0).optional(),
  workingDays: z.coerce.number().int().min(0).max(31).optional(),
  bonuses: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
  manualDeductions: z.coerce.number().min(0).optional(),
  status: z.enum(["DRAFT", "PAID"]).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export type DoctorInput = z.infer<typeof DoctorInputSchema>;
export type DoctorUpdate = z.infer<typeof DoctorUpdateSchema>;
export type DoctorAttendanceInput = z.infer<typeof DoctorAttendanceInputSchema>;
export type DoctorLeaveInput = z.infer<typeof DoctorLeaveInputSchema>;
export type DoctorPayrollAdjust = z.infer<typeof DoctorPayrollAdjustSchema>;
