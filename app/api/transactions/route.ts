export const runtime = "nodejs";

import { jsonResponse } from "@/lib/http";
import { routeHandler, parseJsonBody, parseQuery } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/services/transaction.service";
import {
  CreateTransactionBodySchema,
  ListTransactionsQuerySchema,
} from "@/schemas/transaction.schemas";
import { resolveDateRange } from "@/lib/date-range";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CreateTransactionBodySchema);

    const transaction = await createTransaction(userId, {
      ...body,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });
    return jsonResponse(transaction, 201);
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
