import { z } from "zod";

export const CreateLedgerBodySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["personal", "household"]),
});
export type CreateLedgerBody = z.infer<typeof CreateLedgerBodySchema>;
