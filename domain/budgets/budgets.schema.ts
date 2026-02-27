import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

export const BudgetCategorySchema = z.enum([
  "groceries",
  "eating_out",
  "going_out",
  "transport",
  "clothing",
  "health_and_fitness",
  "other",
  "gifts",
]);

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const YearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  message: "Invalid yearMonth format. Use YYYY-MM",
});

export const BudgetAmountEurSchema = z
  .string()
  .min(1)
  .transform((raw) => raw.trim().replace(",", "."))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), {
    message: "Invalid EUR amount format. Use e.g. 100.00",
  })
  .transform((v) => {
    const [whole, frac = ""] = v.split(".");
    const padded = (frac + "00").slice(0, 2);
    return `${whole}.${padded}`;
  });

export const CreateBudgetAllocationBodySchema = z
  .object({
    ledgerId: IdSchema,
    yearMonth: YearMonthSchema,
    category: BudgetCategorySchema.optional(),
    name: z.string().min(1).max(100).optional(),
    budgetAmountEur: BudgetAmountEurSchema,
  })
  .refine((data) => data.category !== undefined || (data.name !== undefined && data.name.trim().length > 0), {
    message: "Either category or name must be provided",
  });

export type CreateBudgetAllocationBody = z.infer<typeof CreateBudgetAllocationBodySchema>;

export const UpdateBudgetAllocationBodySchema = z.object({
  budgetAmountEur: BudgetAmountEurSchema,
});

export type UpdateBudgetAllocationBody = z.infer<typeof UpdateBudgetAllocationBodySchema>;

export const ListBudgetAllocationsQuerySchema = z.object({
  ledgerId: IdSchema,
  yearMonth: YearMonthSchema.optional(),
});

export type ListBudgetAllocationsQuery = z.infer<typeof ListBudgetAllocationsQuerySchema>;

export const CopyBudgetAllocationsBodySchema = z
  .object({
    ledgerId: IdSchema,
    fromYearMonth: YearMonthSchema,
    toYearMonth: YearMonthSchema,
  })
  .refine((d) => d.fromYearMonth !== d.toYearMonth, {
    message: "Source and destination months must differ",
  });

export type CopyBudgetAllocationsBody = z.infer<typeof CopyBudgetAllocationsBodySchema>;

export const DeleteAllBudgetAllocationsQuerySchema = z.object({
  ledgerId: IdSchema,
  yearMonth: YearMonthSchema,
});

export type DeleteAllBudgetAllocationsQuery = z.infer<typeof DeleteAllBudgetAllocationsQuerySchema>;
