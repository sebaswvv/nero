export const runtime = "nodejs";

import { jsonResponse } from "@/lib/http";
import { routeHandler, parseJsonBody } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { ExpensesSummaryQuerySchema } from "@/schemas/analytics.schema";
import { parseQuery } from "@/lib/validation";
import { getExpensesSummary } from "@/services/analytics.service";
import { resolveDateRange } from "@/lib/date-range";

// GET /api/analytics
export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, ExpensesSummaryQuerySchema);

    const range = resolveDateRange({ from: query.from, to: query.to });

    // call service to get expenses summary
    const summary = await getExpensesSummary(userId, query.ledgerId, range);

    return jsonResponse(summary);
  });
}
