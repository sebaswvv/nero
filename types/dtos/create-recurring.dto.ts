export type Frequency = "monthly";
export type Direction = "expense" | "income";

export type CreateRecurringDto = {
  ledgerId: string;
  name: string;
  amountCents: number;
  direction?: Direction;
  frequency?: Frequency;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string | null;
};

export type CreateRecurringVersionDto = {
  amountCents: number;
  validFrom?: string;
  validTo?: string | null;
  isActive?: boolean;
};
