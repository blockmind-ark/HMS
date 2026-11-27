import { z } from "zod";

export const penaltyKeys = ["OFF", "HALF_DAY", "LEAVE", "ABSENT"] as const;
export const penaltyRuleSchema = z.object({
  allowance: z.coerce.number().int().min(0).max(31),
  mode: z.enum(["FIXED", "PERCENT"]),
  amount: z.coerce.number().finite().min(0).max(100000000),
}).refine(r => r.mode !== "PERCENT" || r.amount <= 100, "Percentage cannot exceed 100");
export const penaltyPolicySchema = z.object({
  enabled: z.boolean().default(false),
  OFF: penaltyRuleSchema,
  HALF_DAY: penaltyRuleSchema,
  LEAVE: penaltyRuleSchema,
  ABSENT: penaltyRuleSchema,
});
export type PenaltyPolicy = z.infer<typeof penaltyPolicySchema>;
export const defaultPenaltyPolicy: PenaltyPolicy = {
  enabled: false,
  OFF: {allowance:0,mode:"FIXED",amount:0},
  HALF_DAY: {allowance:0,mode:"FIXED",amount:0},
  LEAVE: {allowance:0,mode:"FIXED",amount:0},
  ABSENT: {allowance:0,mode:"FIXED",amount:0},
};
export function parsePenaltyPolicy(value: unknown): PenaltyPolicy {
  const parsed = penaltyPolicySchema.safeParse(value);
  return parsed.success ? parsed.data : defaultPenaltyPolicy;
}
export function calculateRuleDeduction(
  excess: number, mode: "FIXED" | "PERCENT", amount: number, basePay: number
) {
  const unit = mode === "PERCENT" ? basePay * amount / 100 : amount;
  return Math.round(excess * unit * 100) / 100;
}

export function calculatePenalty(
 policy: PenaltyPolicy, statuses: string[], basePay: number
) {
 const details = penaltyKeys.map(key => {
   const rule=policy[key];
   const count=statuses.filter(s => s===key).length;
   const excess=Math.max(0,count-rule.allowance);
   const deduction = policy.enabled
     ? calculateRuleDeduction(excess, rule.mode, rule.amount, basePay)
     : 0;
   return {status:key,count,allowance:rule.allowance,excess,mode:rule.mode,amount:rule.amount,deduction};
 });
 return {
   enabled: policy.enabled,
   details,
   total: Math.round(details.reduce((sum, rule) => sum + rule.deduction, 0) * 100) / 100,
 };
}

export type PenaltyBreakdown = Omit<ReturnType<typeof calculatePenalty>, "enabled"> & {
  enabled?: boolean;
};
