import { z } from "zod";
import { DirectionSchema, OccurredAtSchema, IdSchema } from "./common.schemas";

export const TransactionCategorySchema = z.enum([
  "groceries",
  "eating_out",
  "going_out",
  "transport",
  "clothing",
  "health_and_fitness",
  "other",
  "gifts",
  "incidental_income",
]);

export const CreateTransactionBodySchema = z.object({
  ledgerId: IdSchema,
  amountCents: z.number().int().positive(),
  category: TransactionCategorySchema,
  description: z.string().optional(),
  merchant: z.string().optional(),
  occurredAt: OccurredAtSchema.optional().optional(),
  idempotencyKey: z.string().min(1).optional(),
  direction: DirectionSchema.optional().default("expense"),
});
export type CreateTransactionBody = z.infer<typeof CreateTransactionBodySchema>;

export const ListTransactionsQuerySchema = z.object({
  ledgerId: IdSchema,
  from: OccurredAtSchema.optional(),
  to: OccurredAtSchema.optional(),
});
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
