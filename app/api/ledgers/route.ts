export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createLedger, listLedgers } from "@/services/ledger.service";
import { toErrorResponse, jsonResponse } from "@/lib/http";

// POST /api/ledgers
export async function POST(req: Request) {
  // authenticate user
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return toErrorResponse(new Error("Unauthorized"));
	}

  // parse body
	const body = await req.json();

	try {
		const ledger = await createLedger(session.user.id, body);
		return jsonResponse(ledger, 201);
	} catch (e) {
		return toErrorResponse(e);
	}
}

// GET /api/ledgers
export async function GET() {
  // authenticate user
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return toErrorResponse(new Error("Unauthorized"));
	}

  // list ledgers
	try {
    const ledgers = await listLedgers(session.user.id);
		return jsonResponse(ledgers);
	} catch (e) {
		return toErrorResponse(e);
	}
}
