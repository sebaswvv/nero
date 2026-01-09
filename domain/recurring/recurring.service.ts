import { prisma } from "@/lib/api/db";
import { ConflictError, BadRequestError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import type {
  CreateRecurringItemBody,
  CreateRecurringVersionBody,
} from "@/domain/recurring/recurring.schemas";

export async function createRecurringItem(userId: string, body: CreateRecurringItemBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  const validFrom: Date = body.validFrom ?? new Date();
  const validTo: Date | null = body.validTo ?? null;

  // Defensive check (ideally already enforced in Zod refine)
  if (validTo && validFrom > validTo) {
    throw new BadRequestError("INVALID_RANGE", "validFrom must be before validTo");
  }

  try {
    return await prisma.recurringItem.create({
      data: {
        ledgerId: body.ledgerId,
        createdById: userId,
        name: body.name,
        direction: body.direction,
        isActive: body.isActive,
        versions: {
          create: {
            amountEur: body.amountEur,
            validFrom,
            validTo,
            createdById: userId,
          },
        },
      },
      include: { versions: { orderBy: { validFrom: "desc" } } },
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

  if (!item) {
    throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");
  }

  await requireLedgerAccess(userId, item.ledgerId);

  const validFrom: Date = body.validFrom ?? new Date();
  const validTo: Date | null = body.validTo ?? null;

  return await prisma.recurringItemVersion.create({
    data: {
      recurringItemId,
      amountEur: body.amountEur,
      validFrom,
      validTo,
      createdById: userId,
    },
  });
}

export async function listRecurringItems(userId: string, ledgerId: string) {
  await requireLedgerAccess(userId, ledgerId);

  return await prisma.recurringItem.findMany({
    where: { ledgerId },
    include: {
      versions: {
        orderBy: { validFrom: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
}
