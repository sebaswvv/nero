export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { getApiKey, getUserIdFromApiKey } from "@/lib/api/api-key";
import { routeHandler, parseParams } from "@/lib/api/validation";
import { AppleShortcutSummaryHeadersSchema } from "@/domain/analytics/analytics.schema";
import { getExpensesSummary } from "@/domain/analytics/analytics.service";

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

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

    const headers = parseParams(
      { ledgerId: req.headers.get("x-ledger-id") ?? undefined },
      AppleShortcutSummaryHeadersSchema
    );
    const range = getCurrentMonthRange();
    const summary = await getExpensesSummary(userId, headers.ledgerId, range);

    return jsonResponse(summary);
  });
}
