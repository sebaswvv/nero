import { BadRequestError } from "@/lib/errors";

type DateRange = { from: Date; to: Date };

export function resolveDateRange(input: { from?: string; to?: string }): DateRange {
  const now = new Date();

  const to = input.to ? new Date(input.to) : now;
  if (Number.isNaN(to.getTime())) {
    throw new BadRequestError("INVALID_DATE", "to must be a valid ISO date");
  }

  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime())) {
    throw new BadRequestError("INVALID_DATE", "from must be a valid ISO date");
  }

  if (from.getTime() > to.getTime()) {
    throw new BadRequestError("INVALID_RANGE", "from must be before to");
  }

  return { from, to };
}
