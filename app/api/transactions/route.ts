export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { getApiKey, getUserIdFromApiKey } from "@/lib/api/api-key";
import { routeHandler, parseJsonBody, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { createTransactions, listTransactions } from "@/domain/transactions/transaction.service";
import {
  CreateTransactionsBodySchema,
  ListTransactionsQuerySchema,
} from "@/domain/transactions/transaction.schemas";
import { resolveDateRange } from "@/lib/api/date-range";

export async function POST(req: Request) {
  return routeHandler(async () => {
    // if there is no userId, check for an API key that can be used for this endpoint only
    const apiKey = getApiKey(req);
    let userId: string;
    if (apiKey) {
      const id = await getUserIdFromApiKey(apiKey);
      if (!id) {
        console.warn("[transactions] Invalid API key used");
        return jsonResponse({ error: "Invalid API key" }, 401);
      }
      userId = id;
    } else {
      userId = await requireUserId();
    }

    const body = await parseJsonBody(req, CreateTransactionsBodySchema);
    const count = Array.isArray(body) ? body.length : 1;
    console.log(`[transactions] POST user=${userId} count=${count}`);

    const result = await createTransactions(userId, body);
    return jsonResponse(result, 201);
  });
}

export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, ListTransactionsQuerySchema);

    const range = resolveDateRange({ from: query.from, to: query.to });

    const transactions = await listTransactions(userId, query.ledgerId, range);
    return jsonResponse(transactions);
  });
}
