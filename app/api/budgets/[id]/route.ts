export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody, parseParams } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { IdSchema } from "@/schemas/common.schemas";
import { UpdateBudgetAllocationBodySchema } from "@/domain/budgets/budgets.schema";
import { updateBudgetAllocation, deleteBudgetAllocation } from "@/domain/budgets/budgets.service";

const ParamsSchema = z.object({ id: IdSchema });

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const params = await context.params;
    const { id } = parseParams(params, ParamsSchema);
    const body = await parseJsonBody(request, UpdateBudgetAllocationBodySchema);
    console.log(`[budgets/${id}] PUT user=${userId}`);

    const budget = await updateBudgetAllocation(userId, id, body);
    return jsonResponse(budget);
  });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const params = await context.params;
    const { id } = parseParams(params, ParamsSchema);
    console.log(`[budgets/${id}] DELETE user=${userId}`);

    await deleteBudgetAllocation(userId, id);
    return jsonResponse({ success: true });
  });
}
