import { prisma } from "@/lib/db";
import { BadRequestError, ConflictError, ForbiddenError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { CreateRecurringDto, CreateRecurringVersionDto } from "@/types/dtos/create-recurring.dto";

export async function createRecurringItem(userId: string, body: CreateRecurringDto) {
  // validate
  if (!body.name || !body.ledgerId) {
    throw new BadRequestError("NAME_LEDGER_REQUIRED", "name and ledgerId are required");
  }
  if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
    throw new BadRequestError("INVALID_AMOUNT", "amountCents must be a positive integer");
  }

  const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();
  if (Number.isNaN(validFrom.getTime())) {
    throw new BadRequestError("INVALID_DATE", "validFrom must be a valid date");
  }
  const validTo = body.validTo ? new Date(body.validTo) : null;
  if (body.validTo && Number.isNaN((validTo as Date).getTime())) {
    throw new BadRequestError("INVALID_DATE", "validTo must be a valid date");
  }

  // check ledger access
  const member = await prisma.ledgerMember.findUnique({
    where: { ledgerId_userId: { ledgerId: body.ledgerId, userId } },
  });
  if (!member) throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");

  // create recurring item + initial version
  try {
    return await prisma.recurringItem.create({
      data: {
        ledgerId: body.ledgerId,
        createdById: userId,
        name: body.name,
        direction: body.direction ?? "expense",
        frequency: body.frequency ?? "monthly",
        isActive: body.isActive ?? true,
        versions: {
          create: {
            amountCents: body.amountCents,
            validFrom,
            validTo: validTo ?? null,
            createdById: userId,
          },
        },
      },
      include: { versions: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("RECURRING_ITEM_EXISTS", "A recurring item with that name already exists for this ledger");
    }
    throw e;
  }
}

export async function createRecurringItemVersion(userId: string, recurringItemId: string, body: CreateRecurringVersionDto) {
  // validate
  if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
    throw new BadRequestError("INVALID_AMOUNT", "amountCents must be a positive integer");
  }

  const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();
  if (Number.isNaN(validFrom.getTime())) {
    throw new BadRequestError("INVALID_DATE", "validFrom must be a valid date");
  }
  const validTo = body.validTo ? new Date(body.validTo) : null;
  if (body.validTo && Number.isNaN((validTo as Date).getTime())) {
    throw new BadRequestError("INVALID_DATE", "validTo must be a valid date");
  }

  // load recurring item
  const item = await prisma.recurringItem.findUnique({ where: { id: recurringItemId }, select: { id: true, ledgerId: true } });
  if (!item) throw new BadRequestError("INVALID_RECURRING_ITEM", "Recurring item not found");

  // check ledger access
  const member = await prisma.ledgerMember.findUnique({
    where: { ledgerId_userId: { ledgerId: item.ledgerId, userId } },
  });
  if (!member) throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");

  // create new version
  return prisma.recurringItemVersion.create({
    data: {
      recurringItemId,
      amountCents: body.amountCents,
      validFrom,
      validTo: validTo ?? null,
      createdById: userId,
    },
  });
}

export async function listRecurringItems(userId: string, ledgerId: string) {
  // check ledger access
  const member = await prisma.ledgerMember.findUnique({
    where: { ledgerId_userId: { ledgerId, userId } },
  });
  if (!member) throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");

  return prisma.recurringItem.findMany({
    where: { ledgerId },
    include: { versions: { orderBy: { validFrom: "desc" } } },
    orderBy: { name: "asc" },
  });
}
