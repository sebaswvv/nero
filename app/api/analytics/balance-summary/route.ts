export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { getNetBalanceSummary } from "@/domain/analytics/analytics.service";
import { parseQuery } from "@/lib/api/validation";
import { resolveDateRange } from "@/lib/api/date-range";
import { NetBalanceSummaryQuerySchema } from "@/domain/analytics/analytics.schema";

// GET /api/analytics/balance-summary
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, NetBalanceSummaryQuerySchema);
    const range = resolveDateRange({ from: query.from, to: query.to });
    const balanceSummary = await getNetBalanceSummary(userId, query.ledgerId, range);
    return jsonResponse(balanceSummary);
  });
}
