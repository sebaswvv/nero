import { ConflictError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import type { CreateLedgerBody } from "@/domain/ledgers/ledgers.schemas";
import { createLedgerRecord, listLedgerRecordsForUser } from "./ledgers.repository";

export async function createLedger(userId: string, data: CreateLedgerBody) {
  try {
    const ledger = await createLedgerRecord(userId, data);
    console.log(`[ledgers.service] Created ledger id=${ledger.id} user=${userId} name=${data.name}`);
    return ledger;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.warn(`[ledgers.service] Conflict creating ledger user=${userId} name=${data.name}`);
      throw new ConflictError(
        "LEDGER_ALREADY_EXISTS",
        "A ledger with that name and type already exists"
      );
    }
    console.error(`[ledgers.service] Unexpected error creating ledger user=${userId}`, e);
    throw e;
  }
}

export async function listLedgers(userId: string) {
  return listLedgerRecordsForUser(userId);
}
