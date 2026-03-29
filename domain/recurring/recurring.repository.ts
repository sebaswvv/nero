import { prisma } from "@/lib/api/db";
import type { Prisma, RecurringItemVersion } from "@prisma/client";
import type {
  CreateRecurringItemBody,
  CreateRecurringVersionBody,
} from "@/domain/recurring/recurring.schemas";

type RecurringItemWithVersions = Prisma.RecurringItemGetPayload<{
  include: { versions: true };
}>;

function groupVersionsByRecurringItemId(
  versions: RecurringItemVersion[]
): Map<string, RecurringItemVersion[]> {
  const versionsByRecurringItemId = new Map<string, RecurringItemVersion[]>();

  for (const version of versions) {
    const existing = versionsByRecurringItemId.get(version.recurringItemId);
    if (existing) {
      existing.push(version);
      continue;
    }

    versionsByRecurringItemId.set(version.recurringItemId, [version]);
  }

  return versionsByRecurringItemId;
}

async function loadVersionsByRecurringItemId(recurringItemIds: string[]) {
  if (recurringItemIds.length === 0) {
    return new Map<string, RecurringItemVersion[]>();
  }

  const versions = await prisma.recurringItemVersion.findMany({
    where: { recurringItemId: { in: recurringItemIds } },
    orderBy: [{ recurringItemId: "asc" }, { validFrom: "desc" }],
  });

  return groupVersionsByRecurringItemId(versions);
}

export async function createRecurringItemRecord(
  userId: string,
  body: CreateRecurringItemBody,
  validFrom: Date,
  validTo: Date | null
): Promise<RecurringItemWithVersions> {
  const item = await prisma.recurringItem.create({
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
  });

  const versions = await prisma.recurringItemVersion.findMany({
    where: { recurringItemId: item.id },
    orderBy: { validFrom: "desc" },
  });

  return { ...item, versions };
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
  // Avoid relation include on recurringItem: Prisma 7.6 + accelerate can emit invalid SQL aliases here.
  const items = await prisma.recurringItem.findMany({
    where: { ledgerId },
    orderBy: { name: "asc" },
  });

  const versionsByRecurringItemId = await loadVersionsByRecurringItemId(items.map((item) => item.id));

  return items.map((item) => ({
    ...item,
    versions: versionsByRecurringItemId.get(item.id) ?? [],
  }));
}

export async function deleteRecurringItemRecord(recurringItemId: string) {
  return prisma.recurringItem.delete({
    where: { id: recurringItemId },
  });
}
