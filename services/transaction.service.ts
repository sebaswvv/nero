import { prisma } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/ledger-access";
import type { CreateTransactionBody } from "@/schemas/transaction.schemas";

type DateRange = { from: Date; to: Date };

export async function createTransaction(userId: string, body: CreateTransactionBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  try {
    return await prisma.transaction.create({
      data: {
        ledgerId: body.ledgerId,
        userId,
        occurredAt: body.occurredAt ?? new Date(),
        direction: body.direction,
        amountCents: body.amountCents,
        category: body.category,
        description: body.description ?? null,
        merchant: body.merchant ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
    }
    throw e;
  }
}

export async function listTransactions(userId: string, ledgerId: string, range: DateRange) {
  await requireLedgerAccess(userId, ledgerId);

  return prisma.transaction.findMany({
    where: {
      ledgerId,
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    orderBy: { occurredAt: "desc" },
  });
}
