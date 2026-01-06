export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { createRecurringItem, listRecurringItems } from "@/services/recurring.service";
import { CreateRecurringItemBodySchema } from "@/schemas/recurring.schemas";
import { ListTransactionsQuerySchema } from "@/schemas/transaction.schemas";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CreateRecurringItemBodySchema);

    const item = await createRecurringItem(userId, body);
    return jsonResponse(item, 201);
  });
}

export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const { ledgerId } = parseQuery(req, ListTransactionsQuerySchema);

    const items = await listRecurringItems(userId, ledgerId);
    return jsonResponse(items);
  });
}
