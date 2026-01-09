import { BadRequestError } from "@/lib/api/errors";

type DateRange = { from: Date; to: Date };

const MILLISECONDS_IN_A_MONTH = 30 * 24 * 60 * 60 * 1000;

export function resolveDateRange(input: { from?: Date; to?: Date }): DateRange {
  const to = input.to ?? new Date();

  // default to 30 days before 'to'
  const from = input.from ?? new Date(to.getTime() - MILLISECONDS_IN_A_MONTH);

  if (from > to) {
    throw new BadRequestError("INVALID_RANGE", "from must be before to");
  }

  return { from, to };
}
