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
    include: {
      versions: {
        where: {
          validFrom: { lt: nextMonthStart },
          OR: [{ validTo: null }, { validTo: { gte: monthStart } }],
        },
        orderBy: { validFrom: "desc" },
        take: 1,
      },
    },
  });

  return items
    .map((item) => item.versions[0]?.amountEur)
    .filter((amount): amount is Prisma.Decimal => amount !== undefined);
}
