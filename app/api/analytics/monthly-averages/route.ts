export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { MonthlyAveragesQuerySchema } from "@/domain/analytics/analytics.schema";
import { getMonthlyAveragesSummary } from "@/domain/analytics/analytics.service";
import { resolveDateRange } from "@/lib/api/date-range";

// GET /api/analytics/monthly-averages
// returns average monthly expenses per category for variable transactions only
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, MonthlyAveragesQuerySchema);
    const range = resolveDateRange({ from: query.from, to: query.to });
    const summary = await getMonthlyAveragesSummary(userId, query.ledgerId, range);
    return jsonResponse(summary);
  });
}
