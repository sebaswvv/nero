export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { CopyBudgetAllocationsBodySchema } from "@/domain/budgets/budgets.schema";
import { copyBudgetAllocations } from "@/domain/budgets/budgets.service";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CopyBudgetAllocationsBodySchema);
    console.log(
      `[budgets/copy] POST user=${userId} ledger=${body.ledgerId} from=${body.fromYearMonth} to=${body.toYearMonth}`
    );

    const result = await copyBudgetAllocations(userId, body);
    return jsonResponse(result, 201);
  });
}
