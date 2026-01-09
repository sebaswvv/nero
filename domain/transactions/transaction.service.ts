import { ConflictError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import type { CreateTransactionBody } from "@/domain/transactions/transaction.schemas";
import type { DateRange } from "./transactions.repository";
import { createTransactionRecord, listTransactionRecords } from "./transactions.repository";

export async function createTransaction(userId: string, body: CreateTransactionBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  const occurredAt: Date = body.occurredAt ?? new Date();

  try {
    return await createTransactionRecord(userId, body, occurredAt);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
    }
    throw e;
  }
}

export async function listTransactions(userId: string, ledgerId: string, range: DateRange) {
  await requireLedgerAccess(userId, ledgerId);
  return listTransactionRecords(ledgerId, range);
}
