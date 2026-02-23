export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler, parseJsonBody } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { CreateLedgerBodySchema } from "@/domain/ledgers/ledgers.schemas";
import { createLedger, listLedgers } from "@/domain/ledgers/ledgers.service";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CreateLedgerBodySchema);
    console.log(`[ledgers] POST user=${userId} name=${body.name}`);

    const ledger = await createLedger(userId, body);
    return jsonResponse(ledger, 201);
  });
}

export async function GET() {
  return routeHandler(async () => {
    const userId = await requireUserId();

    const ledgers = await listLedgers(userId);
    return jsonResponse(ledgers);
  });
}
