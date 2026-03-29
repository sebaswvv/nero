export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { getApiKey, getUserIdFromApiKey } from "@/lib/api/api-key";
import { routeHandler, parseQuery } from "@/lib/api/validation";
import { ExpensesSummaryQuerySchema } from "@/domain/analytics/analytics.schema";
import { getExpensesSummary } from "@/domain/analytics/analytics.service";
import { resolveDateRange } from "@/lib/api/date-range";

// GET /api/analytics/summary/apple-shortcut
// requires x-api-key and returns expenses summary only
export async function GET(req: Request) {
  return routeHandler(async () => {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      console.warn("[analytics/apple-shortcut] Missing API key");
      return jsonResponse({ error: "Invalid API key" }, 401);
    }

    const userId = await getUserIdFromApiKey(apiKey);
    if (!userId) {
      console.warn("[analytics/apple-shortcut] Invalid API key used");
      return jsonResponse({ error: "Invalid API key" }, 401);
    }

    const query = parseQuery(req, ExpensesSummaryQuerySchema);
    const range = resolveDateRange({ from: query.from, to: query.to });
    const summary = await getExpensesSummary(userId, query.ledgerId, range);

    return jsonResponse(summary);
  });
}
