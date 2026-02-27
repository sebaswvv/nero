import { requireLedgerAccess } from "@/lib/api/ledger-access";
import { BadRequestError, ConflictError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import type {
  CreateBudgetAllocationBody,
  ListBudgetAllocationsQuery,
  UpdateBudgetAllocationBody,
  CopyBudgetAllocationsBody,
  DeleteAllBudgetAllocationsQuery,
  BudgetCategory,
} from "./budgets.schema";
import {
  createBudgetAllocationRecord,
  deleteBudgetAllocationRecord,
  deleteAllBudgetAllocationRecordsForMonth,
  findBudgetAllocationForAccessCheck,
  listBudgetAllocationRecords,
  listLatestRecurringAmountsForMonth,
  updateBudgetAllocationRecord,
} from "./budgets.repository";

export async function createBudgetAllocation(
  userId: string,
  body: CreateBudgetAllocationBody
) {
  await requireLedgerAccess(userId, body.ledgerId);

  try {
    const budget = await createBudgetAllocationRecord(userId, body);
    console.log(
      `[budgets.service] Created budget allocation id=${budget.id} user=${userId} ledger=${body.ledgerId} category=${body.category} yearMonth=${body.yearMonth}`
    );
    return budget;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.warn(
        `[budgets.service] Conflict creating budget allocation user=${userId} ledger=${body.ledgerId} category=${body.category} yearMonth=${body.yearMonth}`
      );
      throw new ConflictError(
        "BUDGET_ALLOCATION_EXISTS",
        "A budget allocation with this category or name already exists for this month"
      );
    }
    throw e;
  }
}

export async function updateBudgetAllocation(
  userId: string,
  budgetAllocationId: string,
  body: UpdateBudgetAllocationBody
) {
  const budget = await findBudgetAllocationForAccessCheck(budgetAllocationId);

  if (!budget) {
    console.warn(
      `[budgets.service] Update attempted on missing allocation id=${budgetAllocationId} user=${userId}`
    );
    throw new BadRequestError("INVALID_BUDGET_ALLOCATION", "Budget allocation not found");
  }

  await requireLedgerAccess(userId, budget.ledgerId);

  const updated = await updateBudgetAllocationRecord(budgetAllocationId, body);
  console.log(
    `[budgets.service] Updated budget allocation id=${budgetAllocationId} user=${userId} ledger=${budget.ledgerId}`
  );
  return updated;
}

export async function deleteBudgetAllocation(userId: string, budgetAllocationId: string) {
  const budget = await findBudgetAllocationForAccessCheck(budgetAllocationId);

  if (!budget) {
    console.warn(
      `[budgets.service] Delete attempted on missing allocation id=${budgetAllocationId} user=${userId}`
    );
    throw new BadRequestError("INVALID_BUDGET_ALLOCATION", "Budget allocation not found");
  }

  await requireLedgerAccess(userId, budget.ledgerId);

  await deleteBudgetAllocationRecord(budgetAllocationId);
  console.log(
    `[budgets.service] Deleted budget allocation id=${budgetAllocationId} user=${userId} ledger=${budget.ledgerId}`
  );
}

export async function copyBudgetAllocations(userId: string, body: CopyBudgetAllocationsBody) {
  await requireLedgerAccess(userId, body.ledgerId);

  const fromAllocations = await listBudgetAllocationRecords(body.ledgerId, body.fromYearMonth);
  if (fromAllocations.length === 0) {
    throw new BadRequestError("NO_ALLOCATIONS", `No allocations found for ${body.fromYearMonth}`);
  }

  let copied = 0;
  let skipped = 0;
  for (const alloc of fromAllocations) {
    try {
      await createBudgetAllocationRecord(userId, {
        ledgerId: body.ledgerId,
        yearMonth: body.toYearMonth,
        category: (alloc.category ?? undefined) as BudgetCategory | undefined,
        name: alloc.name ?? undefined,
        budgetAmountEur: alloc.budgetAmountEur.toFixed(2),
      });
      copied++;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        skipped++;
      } else {
        throw e;
      }
    }
  }

  console.log(
    `[budgets.service] Copied allocations from ${body.fromYearMonth} to ${body.toYearMonth} ledger=${body.ledgerId} copied=${copied} skipped=${skipped}`
  );
  return { copied, skipped, total: fromAllocations.length };
}

export async function deleteAllBudgetAllocationsForMonth(
  userId: string,
  query: DeleteAllBudgetAllocationsQuery
) {
  await requireLedgerAccess(userId, query.ledgerId);

  const result = await deleteAllBudgetAllocationRecordsForMonth(query.ledgerId, query.yearMonth);
  console.log(
    `[budgets.service] Deleted all allocations for ledger=${query.ledgerId} yearMonth=${query.yearMonth} count=${result.count}`
  );
  return { deleted: result.count };
}

export async function getBudgetOverview(userId: string, query: ListBudgetAllocationsQuery) {
  await requireLedgerAccess(userId, query.ledgerId);

  const yearMonth = query.yearMonth ?? getCurrentYearMonth();
  const { monthStart, nextMonthStart } = getMonthBounds(yearMonth);

  const [allocations, recurringIncomeAmounts, recurringExpenseAmounts] = await Promise.all([
    listBudgetAllocationRecords(query.ledgerId, yearMonth),
    listLatestRecurringAmountsForMonth(query.ledgerId, "income", monthStart, nextMonthStart),
    listLatestRecurringAmountsForMonth(query.ledgerId, "expense", monthStart, nextMonthStart),
  ]);

  const recurringIncomeEur = sumAmounts(recurringIncomeAmounts);
  const recurringExpensesEur = sumAmounts(recurringExpenseAmounts);
  const availableToBudgetEur = recurringIncomeEur.minus(recurringExpensesEur);
  const allocatedBudgetEur = sumAmounts(allocations.map((allocation) => allocation.budgetAmountEur));
  const remainingToAllocateEur = availableToBudgetEur.minus(allocatedBudgetEur);

  return {
    ledgerId: query.ledgerId,
    yearMonth,
    totals: {
      recurringIncomeEur: recurringIncomeEur.toFixed(2),
      recurringExpensesEur: recurringExpensesEur.toFixed(2),
      availableToBudgetEur: availableToBudgetEur.toFixed(2),
      allocatedBudgetEur: allocatedBudgetEur.toFixed(2),
      remainingToAllocateEur: remainingToAllocateEur.toFixed(2),
    },
    allocations: allocations.map((allocation) => ({
      ...allocation,
      budgetAmountEur: allocation.budgetAmountEur.toFixed(2),
    })),
  };
}

function sumAmounts(amounts: Prisma.Decimal[]): Prisma.Decimal {
  let total = new Prisma.Decimal(0);
  for (const amount of amounts) {
    total = total.plus(amount);
  }
  return total;
}

function getCurrentYearMonth(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthBounds(yearMonth: string): { monthStart: Date; nextMonthStart: Date } {
  const [yearRaw, monthRaw] = yearMonth.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { monthStart, nextMonthStart };
}
