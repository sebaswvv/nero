export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { getApiKey, getUserIdFromApiKey } from "@/lib/api/api-key";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { createTransactions } from "@/domain/transactions/transaction.service";
import {
  TransactionCategorySchema,
  CreateTransactionBodySchema,
} from "@/domain/transactions/transaction.schemas";
import { AppleShortcutBodySchema, parseShortcutOutput } from "./apple-shortcut";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const apiKey = getApiKey(req);
    let userId: string;
    if (apiKey) {
      const id = await getUserIdFromApiKey(apiKey);
      if (!id) {
        return jsonResponse({ error: "Invalid API key" }, 401);
      }
      userId = id;
    } else {
      userId = await requireUserId();
    }

    const body = await parseJsonBody(req, AppleShortcutBodySchema);

    let parsed: ReturnType<typeof parseShortcutOutput>;
    try {
      parsed = parseShortcutOutput(body.output);
    } catch (err) {
      return jsonResponse(
        { error: err instanceof Error ? err.message : "Failed to parse shortcut output" },
        400
      );
    }

    const categoryResult = TransactionCategorySchema.safeParse(parsed.category);
    if (!categoryResult.success) {
      return jsonResponse(
        { error: `Invalid category "${parsed.category}". Must be one of: ${TransactionCategorySchema.options.join(", ")}` },
        400
      );
    }

    const createBodyResult = CreateTransactionBodySchema.safeParse({
      ledgerId: body.ledgerId,
      amountEur: parsed.amountEur,
      category: categoryResult.data,
      description: parsed.description || undefined,
    });
    if (!createBodyResult.success) {
      return jsonResponse({ error: "VALIDATION_ERROR", message: createBodyResult.error.message }, 400);
    }

    const result = await createTransactions(userId, createBodyResult.data);
    return jsonResponse(result, 201);
  });
}
