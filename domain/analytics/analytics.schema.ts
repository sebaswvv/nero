import { z } from "zod";
import { OccurredAtSchema, IdSchema } from "../../schemas/common.schemas";

export const ExpensesSummaryQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema,
  to: OccurredAtSchema,
});
export type ExpensesSummaryQuery = z.infer<typeof ExpensesSummaryQuerySchema>;

export const IncomeSummaryQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema,
  to: OccurredAtSchema,
});
export type IncomeSummaryQuery = z.infer<typeof IncomeSummaryQuerySchema>;

export const NetBalanceSummaryQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema,
  to: OccurredAtSchema,
});
export type NetBalanceSummaryQuery = z.infer<typeof NetBalanceSummaryQuerySchema>;

export const CombinedAnalyticsSummaryQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema,
  to: OccurredAtSchema,
});
export type CombinedAnalyticsSummaryQuery = z.infer<typeof CombinedAnalyticsSummaryQuerySchema>;
