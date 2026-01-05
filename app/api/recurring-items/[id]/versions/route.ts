export const runtime = "nodejs";

import { jsonResponse } from "@/lib/http";
import { routeHandler, parseJsonBody, parseParams } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { createRecurringItemVersion } from "@/services/recurring.service";
import { CreateRecurringVersionBodySchema } from "@/schemas/recurring.schemas";
import { z } from "zod";
import { IdSchema } from "@/schemas/common.schemas";

const ParamsSchema = z.object({ id: IdSchema });

export async function POST(req: Request, ctx: { params: { id: string } }) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const { id } = parseParams(ctx.params, ParamsSchema);
    const body = await parseJsonBody(req, CreateRecurringVersionBodySchema);

    const version = await createRecurringItemVersion(userId, id, body);
    return jsonResponse(version, 201);
  });
}
