import { z } from "zod";
import {
  DirectionSchema,
  OccurredAtSchema,
  IdSchema,
  MoneyEurSchema,
} from "./common.schemas";

export const CreateRecurringItemBodySchema = z.object({
  ledgerId: IdSchema,
  name: z.string().min(1),
  amountEur: MoneyEurSchema,
  direction: DirectionSchema.optional().default("expense"),
  isActive: z.boolean().optional().default(true),
  validFrom: OccurredAtSchema.optional(),
  validTo: OccurredAtSchema.optional().nullable(),
}).refine(
  (v) => !v.validTo || !v.validFrom || v.validFrom <= v.validTo,
  { message: "validFrom must be before validTo", path: ["validTo"] }
);

export type CreateRecurringItemBody = z.infer<typeof CreateRecurringItemBodySchema>;

export const CreateRecurringVersionBodySchema = z.object({
  amountEur: MoneyEurSchema,
  validFrom: OccurredAtSchema.optional(),
  validTo: OccurredAtSchema.optional().nullable(),
}).refine(
  (v) => !v.validTo || !v.validFrom || v.validFrom <= v.validTo,
  { message: "validFrom must be before validTo", path: ["validTo"] }
);

export type CreateRecurringVersionBody = z.infer<typeof CreateRecurringVersionBodySchema>;

export const ListRecurringItemsQuerySchema = z.object({
  ledgerId: IdSchema,
});
export type ListRecurringItemsQuery = z.infer<typeof ListRecurringItemsQuerySchema>;
