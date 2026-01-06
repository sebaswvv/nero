export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { IncomeSummaryQuerySchema } from "@/schemas/analytics.schema";
import { getIncomeSummary } from "@/services/analytics.service";
import { parseQuery } from "@/lib/api/validation";
import { resolveDateRange } from "@/lib/api/date-range";

// GET /api/analytics/income-summary
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, IncomeSummaryQuerySchema);
    const range = resolveDateRange({ from: query.from, to: query.to });
    const incomeSummary = await getIncomeSummary(userId, query.ledgerId, range);
    return jsonResponse(incomeSummary);
  });
}
