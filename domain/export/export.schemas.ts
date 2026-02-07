import { z } from "zod";

export const ExportQuerySchema = z.object({
  ledgerId: z.string().min(1, "Ledger ID is required"),
});

export type ExportQuery = z.infer<typeof ExportQuerySchema>;
