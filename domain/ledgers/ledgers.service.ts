import { ConflictError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import type { CreateLedgerBody } from "@/domain/ledgers/ledgers.schemas";
import { createLedgerRecord, listLedgerRecordsForUser } from "./ledgers.repository";

export async function createLedger(userId: string, data: CreateLedgerBody) {
  try {
    return await createLedgerRecord(userId, data);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError(
        "LEDGER_ALREADY_EXISTS",
        "A ledger with that name and type already exists"
      );
    }
    throw e;
  }
}

export async function listLedgers(userId: string) {
  return listLedgerRecordsForUser(userId);
}
