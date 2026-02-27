export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import {
  CreateBudgetAllocationBodySchema,
  ListBudgetAllocationsQuerySchema,
  DeleteAllBudgetAllocationsQuerySchema,
} from "@/domain/budgets/budgets.schema";
import {
  createBudgetAllocation,
  getBudgetOverview,
  deleteAllBudgetAllocationsForMonth,
} from "@/domain/budgets/budgets.service";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CreateBudgetAllocationBodySchema);
    console.log(
      `[budgets] POST user=${userId} ledger=${body.ledgerId} category=${body.category} yearMonth=${body.yearMonth}`
    );

    const budget = await createBudgetAllocation(userId, body);
    return jsonResponse(budget, 201);
  });
}

export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, ListBudgetAllocationsQuerySchema);

    const overview = await getBudgetOverview(userId, query);
    return jsonResponse(overview);
  });
}

export async function DELETE(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, DeleteAllBudgetAllocationsQuerySchema);
    console.log(`[budgets] DELETE all user=${userId} ledger=${query.ledgerId} yearMonth=${query.yearMonth}`);

    const result = await deleteAllBudgetAllocationsForMonth(userId, query);
    return jsonResponse(result);
  });
}