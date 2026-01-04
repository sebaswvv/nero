import { getApiKey } from "@/lib/api-key";
import { createTransaction } from "@/services/transaction.service";
import { toErrorResponse, jsonResponse } from "@/lib/http";
import { CreateTransactionDto } from "@/types/dtos/create-transaction.dto";

export const runtime = "nodejs";

// POST /api/transactions
export async function POST(req: Request) {
	// use API key auth for this endpoint
	const apiKey = getApiKey(req);
	if (!apiKey) {
		return toErrorResponse(new Error("Missing API key"));
	}

    // parse body
	let body: CreateTransactionDto;
	try {
		body = (await req.json()) as CreateTransactionDto;
	} catch (e) {
		return toErrorResponse(new Error("Invalid JSON body"));
	}

    // create new transaction
	try {
		const transaction = await createTransaction(apiKey, body);
		return jsonResponse(transaction, 201);
	} catch (e) {
		return toErrorResponse(e);
	}
}
