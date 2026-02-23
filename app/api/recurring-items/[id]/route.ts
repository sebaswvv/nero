export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseParams } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { deleteRecurringItem } from "@/domain/recurring/recurring.service";
import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

const ParamsSchema = z.object({ id: IdSchema });

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const params = await context.params;
    const { id } = parseParams(params, ParamsSchema);
    console.log(`[recurring-items/${id}] DELETE user=${userId}`);

    await deleteRecurringItem(userId, id);
    return jsonResponse({ success: true });
  });
}
