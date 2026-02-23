import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

export const AppleShortcutBodySchema = z.object({
  ledgerId: IdSchema,
  output: z.string().min(1),
});

export type AppleShortcutBody = z.infer<typeof AppleShortcutBodySchema>;

/**
 * Parses the flat AI output produced by the Apple Shortcut automation:
 *
 *   category: going_out
 *   description: Vue Amersfoort (bioscoop)
 *   amount: 11,50
 *
 * Returns an object with { category, description, amountEur } or throws on
 * parse failure.
 */
export function parseShortcutOutput(output: string): {
  category: string;
  description: string;
  amountEur: string;
} {
  const lines = output.split("\n");
  const map: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();
    map[key] = value;
  }

  const missing = ["category", "description", "amount"].filter((k) => !map[k]);
  if (missing.length > 0) {
    throw new Error(`Missing fields in shortcut output: ${missing.join(", ")}`);
  }

  return {
    category: map["category"],
    description: map["description"],
    amountEur: map["amount"],
  };
}
