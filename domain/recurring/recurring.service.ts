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
    return await createRecurringItemRecord(userId, body, validFrom, validTo);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError(
        "RECURRING_ITEM_EXISTS",
        "A recurring item with that name already exists for this ledger"
      );
    }
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
    throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");
  }

  // check access
  await requireLedgerAccess(userId, item.ledgerId);

  const validFrom: Date = body.validFrom ?? new Date();
  const validTo: Date | null = body.validTo ?? null;

  return createRecurringItemVersionRecord(userId, recurringItemId, body, validFrom, validTo);
}

export async function listRecurringItems(userId: string, ledgerId: string) {
  await requireLedgerAccess(userId, ledgerId);
  return listRecurringItemRecords(ledgerId);
}

export async function deleteRecurringItem(userId: string, recurringItemId: string) {
  const item = await findRecurringItemForAccessCheck(recurringItemId);

  if (!item) {
    throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");
  }

  await requireLedgerAccess(userId, item.ledgerId);

  return deleteRecurringItemRecord(recurringItemId);
}
