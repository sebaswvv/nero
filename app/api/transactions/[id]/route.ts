export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseParams } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { deleteTransaction } from "@/domain/transactions/transaction.service";
import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

const ParamsSchema = z.object({ id: IdSchema });

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const params = await context.params;
    const { id } = parseParams(params, ParamsSchema);

    await deleteTransaction(userId, id);
    return jsonResponse({ success: true });
  });
}
