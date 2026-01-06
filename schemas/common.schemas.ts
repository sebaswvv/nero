import { z } from "zod";

export const IdSchema = z.string().min(1);
export const DirectionSchema = z.enum(["expense", "income"]);

export const OccurredAtSchema = z.coerce.date();

// thnx chat <3
export const MoneyEurSchema = z
  .string()
  .min(1)
  .transform((raw) => raw.trim().replace(",", "."))
  .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(v), {
    message: "Invalid EUR amount format. Use e.g. 100.00",
  })
  .transform((v) => {
    const [whole, frac = ""] = v.split(".");
    const padded = (frac + "00").slice(0, 2);
    return `${whole}.${padded}`;
  })
  .refine((v) => {
    const asNumber = Number(v);
    return Number.isFinite(asNumber) && asNumber > 0;
  }, { message: "Amount must be greater than 0" });
