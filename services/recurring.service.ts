import { prisma } from "@/lib/db";
import { ConflictError, BadRequestError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/ledger-access";
import type {
  CreateRecurringItemBody,
  CreateRecurringVersionBody,
} from "@/schemas/recurring.schemas";

export async function createRecurringItem(userId: string, body: CreateRecurringItemBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  // validate dates
  const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();
  const validTo = body.validTo ? new Date(body.validTo) : null;

  if (validTo && validFrom.getTime() > validTo.getTime()) {
    throw new BadRequestError("INVALID_RANGE", "validFrom must be before validTo");
  }

  try {
    return await prisma.recurringItem.create({
      data: {
        ledgerId: body.ledgerId,
        createdById: userId,
        name: body.name,
        direction: body.direction,
        frequency: body.frequency,
        isActive: body.isActive,
        versions: {
          create: {
            amountCents: body.amountCents,
            validFrom,
            validTo,
            createdById: userId,
          },
        },
      },
      include: { versions: true },
    });
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
  const item = await prisma.recurringItem.findUnique({
    where: { id: recurringItemId },
    select: { id: true, ledgerId: true },
  });
  if (!item) throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");

  await requireLedgerAccess(userId, item.ledgerId);

  // validate dates
  const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();
  const validTo = body.validTo ? new Date(body.validTo) : null;

  if (validTo && validFrom.getTime() > validTo.getTime()) {
    throw new BadRequestError("INVALID_RANGE", "validFrom must be before validTo");
  }

  return prisma.recurringItemVersion.create({
    data: {
      recurringItemId,
      amountCents: body.amountCents,
      validFrom,
      validTo,
      createdById: userId,
    },
  });
}

export async function listRecurringItems(userId: string, ledgerId: string) {
  await requireLedgerAccess(userId, ledgerId);

  return prisma.recurringItem.findMany({
    where: { ledgerId },
    include: { versions: { orderBy: { validFrom: "desc" } } },
    orderBy: { name: "asc" },
  });
}
