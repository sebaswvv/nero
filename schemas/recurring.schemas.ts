import { z } from "zod";
import { DirectionSchema, FrequencySchema, OccurredAtSchema, IdSchema } from "./common.schemas";

export const CreateRecurringItemBodySchema = z.object({
  ledgerId: IdSchema,
  name: z.string().min(1),
  amountCents: z.number().int().positive(),
  direction: DirectionSchema.optional().default("expense"),
  frequency: FrequencySchema.optional().default("monthly"),
  isActive: z.boolean().optional().default(true),
  validFrom: OccurredAtSchema.optional(),
  validTo: OccurredAtSchema.nullable().optional(),
});
export type CreateRecurringItemBody = z.infer<typeof CreateRecurringItemBodySchema>;

export const CreateRecurringVersionBodySchema = z.object({
  amountCents: z.number().int().positive(),
  validFrom: OccurredAtSchema.optional(),
  validTo: OccurredAtSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});
export type CreateRecurringVersionBody = z.infer<typeof CreateRecurringVersionBodySchema>;

const ListRecurringItemsQuerySchema = z.object({
  ledgerId: IdSchema,
});
export type ListRecurringItemsQuery = z.infer<typeof ListRecurringItemsQuerySchema>;
