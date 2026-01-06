import { BadRequestError } from "@/lib/api/errors";

type DateRange = { from: Date; to: Date };

export function resolveDateRange(input: { from?: Date; to?: Date }): DateRange {
  const to = input.to ?? new Date();

  const from = input.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // default to 30 days before 'to'

  if (from > to) {
    throw new BadRequestError("INVALID_RANGE", "from must be before to");
  }

  return { from, to };
}
