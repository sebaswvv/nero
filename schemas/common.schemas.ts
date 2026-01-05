import { z } from "zod";

export const IdSchema = z.string().min(1);
export const DirectionSchema = z.enum(["expense", "income"]);
export const FrequencySchema = z.enum(["monthly"]);

// Accepts either a full ISO datetime or a date-only string (YYYY-MM-DD)
const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)");

const IsoDateTimeSchema = z.iso
  .datetime()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid ISO datetime");

export const OccurredAtSchema = z.union([IsoDateTimeSchema, DateOnlySchema]).transform((v) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
  return v;
});
