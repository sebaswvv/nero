export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/http";
import { routeHandler, parseJsonBody, parseParams } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { createRecurringItemVersion } from "@/services/recurring.service";
import { CreateRecurringVersionBodySchema } from "@/schemas/recurring.schemas";
import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

const ParamsSchema = z.object({ id: IdSchema });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const params = await context.params;
    const { id } = parseParams(params, ParamsSchema);

    const body = await parseJsonBody(request, CreateRecurringVersionBodySchema);

    const version = await createRecurringItemVersion(userId, id, body);
    return jsonResponse(version, 201);
  });
}
