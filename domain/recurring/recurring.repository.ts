import { prisma } from "@/lib/api/db";
import type {
  CreateRecurringItemBody,
  CreateRecurringVersionBody,
} from "@/domain/recurring/recurring.schemas";

export async function createRecurringItemRecord(
  userId: string,
  body: CreateRecurringItemBody,
  validFrom: Date,
  validTo: Date | null
) {
  return prisma.recurringItem.create({
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
}

export async function findRecurringItemForAccessCheck(recurringItemId: string) {
  return prisma.recurringItem.findUnique({
    where: { id: recurringItemId },
    select: { id: true, ledgerId: true },
  });
}

export async function createRecurringItemVersionRecord(
  userId: string,
  recurringItemId: string,
  body: CreateRecurringVersionBody,
  validFrom: Date,
  validTo: Date | null
) {
  return prisma.recurringItemVersion.create({
    data: {
      recurringItemId,
      amountEur: body.amountEur,
      validFrom,
      validTo,
      createdById: userId,
    },
  });
}

export async function listRecurringItemRecords(ledgerId: string) {
  return prisma.recurringItem.findMany({
    where: { ledgerId },
    include: {
      versions: {
        orderBy: { validFrom: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function deleteRecurringItemRecord(recurringItemId: string) {
  return prisma.recurringItem.delete({
    where: { id: recurringItemId },
  });
}
