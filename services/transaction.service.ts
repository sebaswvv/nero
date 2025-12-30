import { prisma } from "@/lib/db";
import { CreateTransactionDto } from "@/types/dtos/create-transaction.dto";

export async function createTransaction(
  apiKey: string,
  body: CreateTransactionDto
) {
    // get the user by API key
    const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true },
    });
    if (!user) throw new Error("INVALID_API_KEY");

    // check ledger access
    const member = await prisma.ledgerMember.findUnique({
    where: {
        ledgerId_userId: {
        ledgerId: body.ledgerId,
        userId: user.id,
        },
    },
    });
    if (!member) throw new Error("NO_LEDGER_ACCESS");

    // validate amount
    if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
    throw new Error("INVALID_AMOUNT");
    }

    // validate date
    const occurredAt = body.occurredAt
    ? new Date(body.occurredAt)
    : new Date();

    // check date validity
    if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("INVALID_DATE");
    }

    // create transaction
    return prisma.transaction.create({
    data: {
        ledgerId: body.ledgerId,
        userId: user.id,
        occurredAt,
        direction: body.direction ?? "expense",
        amountCents: body.amountCents,
        category: body.category,
        description: body.description ?? null,
        merchant: body.merchant ?? null,
        idempotencyKey: body.idempotencyKey ?? null,
    },
    });
}
