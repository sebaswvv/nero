import { ConflictError, BadRequestError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import type {
  CreateRecurringItemBody,
  CreateRecurringVersionBody,
} from "@/domain/recurring/recurring.schemas";
import {
  createRecurringItemRecord,
  createRecurringItemVersionRecord,
  findRecurringItemForAccessCheck,
  listRecurringItemRecords,
  deleteRecurringItemRecord,
} from "./recurring.repository";

export async function createRecurringItem(userId: string, body: CreateRecurringItemBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  const validFrom: Date = body.validFrom ?? new Date();
  const validTo: Date | null = body.validTo ?? null;

  if (validTo && validFrom > validTo) {
    throw new BadRequestError("INVALID_RANGE", "validFrom must be before validTo");
  }

  try {
    const item = await createRecurringItemRecord(userId, body, validFrom, validTo);
    console.log(`[recurring.service] Created recurring item id=${item.id} user=${userId} ledger=${body.ledgerId}`);
    return item;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.warn(`[recurring.service] Conflict creating recurring item user=${userId} ledger=${body.ledgerId}`);
      throw new ConflictError(
        "RECURRING_ITEM_EXISTS",
        "A recurring item with that name already exists for this ledger"
      );
    }
    console.error(`[recurring.service] Unexpected error creating recurring item user=${userId}`, e);
    throw e;
  }
}

export async function createRecurringItemVersion(
  userId: string,
  recurringItemId: string,
  body: CreateRecurringVersionBody
) {
  const item = await findRecurringItemForAccessCheck(recurringItemId);

  if (!item) {
    console.warn(`[recurring.service] Version creation attempted on missing item id=${recurringItemId} user=${userId}`);
    throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");
  }

  // check access
  await requireLedgerAccess(userId, item.ledgerId);

  const validFrom: Date = body.validFrom ?? new Date();
  const validTo: Date | null = body.validTo ?? null;

  const version = await createRecurringItemVersionRecord(userId, recurringItemId, body, validFrom, validTo);
  console.log(`[recurring.service] Created version id=${version.id} for item=${recurringItemId} user=${userId}`);
  return version;
}

export async function listRecurringItems(userId: string, ledgerId: string) {
  await requireLedgerAccess(userId, ledgerId);
  return listRecurringItemRecords(ledgerId);
}

export async function deleteRecurringItem(userId: string, recurringItemId: string) {
  const item = await findRecurringItemForAccessCheck(recurringItemId);

  if (!item) {
    console.warn(`[recurring.service] Delete attempted on missing item id=${recurringItemId} user=${userId}`);
    throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");
  }

  await requireLedgerAccess(userId, item.ledgerId);

  const result = await deleteRecurringItemRecord(recurringItemId);
  console.log(`[recurring.service] Deleted recurring item id=${recurringItemId} user=${userId} ledger=${item.ledgerId}`);
  return result;
}
