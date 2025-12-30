import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/api-key";
import { createTransaction } from "@/services/transaction.service";
import { CreateTransactionDto } from "@/types/dtos/create-transaction.dto";

export const runtime = "nodejs";

export async function POST(req: Request) {
    // use API key auth for this endpoint
    const apiKey = getApiKey(req);
    if (!apiKey) {
        return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const body = (await req.json()) as CreateTransactionDto;

    // process creation
    try {
        const tx = await createTransaction(apiKey, body);
        return NextResponse.json(tx, { status: 201 });
    } catch (e) {
        const msg = (e as Error).message;

        const status =
        msg === "INVALID_API_KEY" ? 401 :
        msg === "NO_LEDGER_ACCESS" ? 403 :
        msg === "INVALID_AMOUNT" || msg === "INVALID_DATE" ? 400 :
        msg === "P2002" ? 409 :
        500;

        return NextResponse.json({ error: msg }, { status });
  }
}
