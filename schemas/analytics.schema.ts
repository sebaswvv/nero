import { z } from "zod";
import { OccurredAtSchema, IdSchema } from "./common.schemas";

export const ExpensesSummaryQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema,
  to: OccurredAtSchema,
});
export type ExpensesSummaryQuery = z.infer<typeof ExpensesSummaryQuerySchema>;
