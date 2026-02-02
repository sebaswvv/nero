export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { CombinedAnalyticsSummaryQuerySchema } from "@/domain/analytics/analytics.schema";
import { getCombinedAnalyticsSummary } from "@/domain/analytics/analytics.service";
import { resolveDateRange } from "@/lib/api/date-range";

// GET /api/analytics/summary
// returns all analytics data (expenses, income, balance) in a single optimized call
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, CombinedAnalyticsSummaryQuerySchema);
    const range = resolveDateRange({ from: query.from, to: query.to });
    const summary = await getCombinedAnalyticsSummary(userId, query.ledgerId, range);
    return jsonResponse(summary);
  });
}
