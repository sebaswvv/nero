import { prisma } from "@/lib/api/db";
import type { CreateTransactionBody } from "@/domain/transactions/transaction.schemas";

export type DateRange = { from: Date; to: Date };

export async function createTransactionRecord(
  userId: string,
  body: CreateTransactionBody,
  occurredAt: Date
) {
  return prisma.transaction.create({
    data: {
      ledgerId: body.ledgerId,
      userId,
      occurredAt,
      direction: body.direction,
      amountEur: body.amountEur,
      category: body.category,
      description: body.description ?? null,
    },
  });
}

export async function listTransactionRecords(ledgerId: string, range: DateRange) {
  return prisma.transaction.findMany({
    where: {
      ledgerId,
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    orderBy: { occurredAt: "desc" },
  });
}

export async function findTransactionForAccessCheck(transactionId: string) {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, ledgerId: true },
  });
}

export async function deleteTransactionRecord(transactionId: string) {
  return prisma.transaction.delete({
    where: { id: transactionId },
  });
}
