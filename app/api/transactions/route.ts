import { createTransaction, listTransactions } from "@/services/transaction.service";
import { toErrorResponse, jsonResponse } from "@/lib/http";
import { CreateTransactionDto } from "@/types/dtos/create-transaction.dto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

// POST /api/transactions
export async function POST(req: Request) {
	// normal session auth
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return toErrorResponse(new Error("Unauthorized"));
	}

	// parse body
	let body: CreateTransactionDto;
	try {
		body = (await req.json()) as CreateTransactionDto;
	} catch (e) {
		return toErrorResponse(new Error("Invalid JSON body"));
	}

	// create new transaction (use session.user.id)
	try {
		const transaction = await createTransaction(session.user.id, body);
		return jsonResponse(transaction, 201);
	} catch (e) {
		return toErrorResponse(e);
	}
}

// GET /api/transactions?ledgerId=...&period=monthly|yearly&date=YYYY-MM|YYYY
export async function GET(req: Request) {
  	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
    return toErrorResponse(new Error("Unauthorized"));
  	}

	const url = new URL(req.url);
	const ledgerId = url.searchParams.get("ledgerId");
	const period = (url.searchParams.get("period") ?? "monthly") as "monthly" | "yearly";
	const date = url.searchParams.get("date") ?? undefined;

	if (!ledgerId) {
		return toErrorResponse(new Error("ledgerId is required"));
	}

	try {
		const transactions = await listTransactions(session.user.id, ledgerId, period, date);
		return jsonResponse(transactions);
	} catch (e) {
		return toErrorResponse(e);
	}
}
