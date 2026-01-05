export type TransactionCategory =
  | "groceries"
  | "eating_out"
  | "going_out"
  | "transport"
  | "clothing"
  | "health_and_fitness"
  | "other"
  | "gifts"
  | "incidental_income";

export type CreateTransactionDto = {
  ledgerId: string;
  amountCents: number;
  category: TransactionCategory;
  description?: string;
  merchant?: string;
  occurredAt?: string;
  idempotencyKey?: string;
  direction?: "expense" | "income";
};
