export const runtime = "nodejs";

import { jsonResponse } from "@/lib/http";
import { routeHandler, parseJsonBody } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { CreateLedgerBodySchema } from "@/schemas/ledger.schemas";
import { createLedger, listLedgers } from "@/services/ledger.service";

export async function POST(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, CreateLedgerBodySchema);

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
