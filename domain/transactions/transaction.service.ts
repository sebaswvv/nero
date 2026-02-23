import { ConflictError, BadRequestError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import type {
  CreateTransactionBody,
  CreateTransactionsBody,
  Transaction,
  UpdateTransactionBody,
} from "@/domain/transactions/transaction.schemas";
import type { DateRange } from "./transactions.repository";
import {
  createTransactionRecord,
  createManyTransactionRecords,
  listTransactionRecords,
  findTransactionForAccessCheck,
  deleteTransactionRecord,
  updateTransactionRecord,
} from "./transactions.repository";

export async function createTransaction(userId: string, body: CreateTransactionBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  const occurredAt: Date = body.occurredAt ?? new Date();

  try {
    const transaction = await createTransactionRecord(userId, body, occurredAt);
    console.log(`[transaction.service] Created transaction id=${transaction.id} user=${userId} ledger=${body.ledgerId} amount=${body.amountEur} category=${body.category}`);
    return transaction;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.error(`[transaction.service] Unique constraint violation, user=${userId} ledger=${body.ledgerId}`);
      throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
    }
    console.error(`[transaction.service] Unexpected error creating transaction, user=${userId} ledger=${body.ledgerId}`, e);
    throw e;
  }
}

export async function createTransactions(userId: string, body: CreateTransactionsBody) {
  // handle single transaction (backward compatibility)
  if (!Array.isArray(body)) {
    return [await createTransaction(userId, body)];
  }

  // validate access to all ledgers upfront
  const uniqueLedgerIds = [...new Set(body.map((t) => t.ledgerId))];
  await Promise.all(uniqueLedgerIds.map((ledgerId) => requireLedgerAccess(userId, ledgerId)));

  // prepare transactions with timestamps
  const transactions = body.map((txn) => ({
    body: txn,
    occurredAt: txn.occurredAt ?? new Date(),
  }));

  try {
    await createManyTransactionRecords(userId, transactions);
    // return count for bulk operations
    return { count: transactions.length };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.error("[transaction.service] Unique constraint violation during bulk insert, userId=", userId);
      throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
    }
    console.error("[transaction.service] Unexpected error during bulk insert, userId=", userId, e);
    throw e;
  }
}

export async function listTransactions(userId: string, ledgerId: string, range: DateRange) {
  await requireLedgerAccess(userId, ledgerId);
  return listTransactionRecords(ledgerId, range);
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const transaction = await findTransactionForAccessCheck(transactionId);

  if (!transaction) {
    console.warn(`[transaction.service] Delete attempted on missing transaction id=${transactionId} user=${userId}`);
    throw new BadRequestError("INVALID_TRANSACTION", "Transaction not found");
  }

  await requireLedgerAccess(userId, transaction.ledgerId);

  const result = await deleteTransactionRecord(transactionId);
  console.log(`[transaction.service] Deleted transaction id=${transactionId} user=${userId} ledger=${transaction.ledgerId}`);
  return result;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  body: UpdateTransactionBody
) {
  const transaction = await findTransactionForAccessCheck(transactionId);

  if (!transaction) {
    console.warn(`[transaction.service] Update attempted on missing transaction id=${transactionId} user=${userId}`);
    throw new BadRequestError("INVALID_TRANSACTION", "Transaction not found");
  }

  await requireLedgerAccess(userId, transaction.ledgerId);

  try {
    const updated = await updateTransactionRecord(transactionId, body);
    console.log(`[transaction.service] Updated transaction id=${transactionId} user=${userId} ledger=${transaction.ledgerId}`);
    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.error(`[transaction.service] Unique constraint violation on update, id=${transactionId} user=${userId}`);
      throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
    }
    throw e;
  }
}
