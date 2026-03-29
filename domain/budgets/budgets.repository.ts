import { prisma } from "@/lib/api/db";
import { Prisma, type TransactionDirection } from "@prisma/client";
import type {
  CreateBudgetAllocationBody,
  UpdateBudgetAllocationBody,
} from "./budgets.schema";

export async function createBudgetAllocationRecord(
  userId: string,
  body: CreateBudgetAllocationBody
) {
  return prisma.budgetAllocation.create({
    data: {
      ledgerId: body.ledgerId,
      userId,
      yearMonth: body.yearMonth,
      category: body.category ?? null,
      name: body.name ?? null,
      budgetAmountEur: body.budgetAmountEur,
    },
  });
}

export async function updateBudgetAllocationRecord(
  budgetAllocationId: string,
  body: UpdateBudgetAllocationBody
) {
  return prisma.budgetAllocation.update({
    where: { id: budgetAllocationId },
    data: {
      budgetAmountEur: body.budgetAmountEur,
    },
  });
}

export async function listBudgetAllocationRecords(ledgerId: string, yearMonth: string) {
  return prisma.budgetAllocation.findMany({
    where: { ledgerId, yearMonth },
    orderBy: { category: "asc" },
  });
}

export async function findBudgetAllocationForAccessCheck(budgetAllocationId: string) {
  return prisma.budgetAllocation.findUnique({
    where: { id: budgetAllocationId },
    select: { id: true, ledgerId: true },
  });
}

export async function deleteBudgetAllocationRecord(budgetAllocationId: string) {
  return prisma.budgetAllocation.delete({
    where: { id: budgetAllocationId },
  });
}

export async function deleteAllBudgetAllocationRecordsForMonth(ledgerId: string, yearMonth: string) {
  return prisma.budgetAllocation.deleteMany({
    where: { ledgerId, yearMonth },
  });
}

export async function listLatestRecurringAmountsForMonth(
  ledgerId: string,
  direction: TransactionDirection,
  monthStart: Date,
  nextMonthStart: Date
): Promise<Prisma.Decimal[]> {
  // Avoid relation include on recurringItem: Prisma 7.6 + accelerate can emit invalid SQL aliases here.
  const items = await prisma.recurringItem.findMany({
    where: {
      ledgerId,
      direction,
      isActive: true,
      versions: {
        some: {
          validFrom: { lt: nextMonthStart },
          OR: [{ validTo: null }, { validTo: { gte: monthStart } }],
        },
      },
    },
    select: { id: true },
  });

  if (items.length === 0) {
    return [];
  }

  const versions = await prisma.recurringItemVersion.findMany({
    where: {
      recurringItemId: { in: items.map((item) => item.id) },
      validFrom: { lt: nextMonthStart },
      OR: [{ validTo: null }, { validTo: { gte: monthStart } }],
    },
    orderBy: [{ recurringItemId: "asc" }, { validFrom: "desc" }],
    select: {
      recurringItemId: true,
      amountEur: true,
    },
  });

  const latestAmountByItemId = new Map<string, Prisma.Decimal>();

  for (const version of versions) {
    if (!latestAmountByItemId.has(version.recurringItemId)) {
      latestAmountByItemId.set(version.recurringItemId, version.amountEur);
    }
  }

  return [...latestAmountByItemId.values()];
}
