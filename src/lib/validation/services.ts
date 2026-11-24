import { z } from "zod";

export const UltrasoundServiceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  price: z.coerce
    .number()
    .min(0, "Price must be non-negative (>= 0)"),
  isActive: z.boolean().optional().default(true),
});

export const UltrasoundServiceUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters")
    .optional(),
  price: z.coerce
    .number()
    .min(0, "Price must be non-negative (>= 0)")
    .optional(),
  isActive: z.boolean().optional(),
});

export const TokenServiceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Token service name must be at least 2 characters")
    .max(100, "Token service name cannot exceed 100 characters"),
  fee: z.coerce
    .number()
    .min(0, "Fee must be non-negative (>= 0)"),
  isActive: z.boolean().optional().default(true),
});

export const TokenServiceUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Token service name must be at least 2 characters")
    .max(100, "Token service name cannot exceed 100 characters")
    .optional(),
  fee: z.coerce
    .number()
    .min(0, "Fee must be non-negative (>= 0)")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UltrasoundServiceInput = z.infer<typeof UltrasoundServiceInputSchema>;
export type UltrasoundServiceUpdate = z.infer<typeof UltrasoundServiceUpdateSchema>;
export type TokenServiceInput = z.infer<typeof TokenServiceInputSchema>;
export type TokenServiceUpdate = z.infer<typeof TokenServiceUpdateSchema>;
