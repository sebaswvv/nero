import { z } from "zod";
import { Transaction as PrismaTransaction } from "@prisma/client";
import {
  DirectionSchema,
  OccurredAtSchema,
  IdSchema,
  MoneyEurSchema,
} from "../../schemas/common.schemas";

export type Transaction = PrismaTransaction;

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
  amountEur: MoneyEurSchema,
  category: TransactionCategorySchema,
  description: z.string().optional(),
  occurredAt: OccurredAtSchema.optional(),
  direction: DirectionSchema.optional().default("expense"),
});

export type CreateTransactionBody = z.infer<typeof CreateTransactionBodySchema>;

export const CreateTransactionsBodySchema = z.union([
  CreateTransactionBodySchema,
  z.array(CreateTransactionBodySchema).min(1),
]);

export type CreateTransactionsBody = z.infer<typeof CreateTransactionsBodySchema>;

export const ListTransactionsQuerySchema = z
  .object({
    ledgerId: IdSchema,
    from: OccurredAtSchema.optional(),
    to: OccurredAtSchema.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "from must be before to",
    path: ["to"],
  });

export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

export const UpdateTransactionBodySchema = z.object({
  amountEur: MoneyEurSchema.optional(),
  category: TransactionCategorySchema.optional(),
  description: z.string().optional().nullable(),
  occurredAt: OccurredAtSchema.optional(),
  direction: DirectionSchema.optional(),
});

export type UpdateTransactionBody = z.infer<typeof UpdateTransactionBodySchema>;
