export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { ExpensesSummaryQuerySchema } from "@/domain/analytics/analytics.schema";
import { parseQuery } from "@/lib/api/validation";
import { getExpensesSummary } from "@/domain/analytics/analytics.service";
import { resolveDateRange } from "@/lib/api/date-range";

// GET /api/analytics/expenses-summary
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, ExpensesSummaryQuerySchema);

    const range = resolveDateRange({ from: query.from, to: query.to });

    const summary = await getExpensesSummary(userId, query.ledgerId, range);

    return jsonResponse(summary);
  });
}
