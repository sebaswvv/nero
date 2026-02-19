import { prisma } from "@/lib/api/db";
import type { CreateTransactionBody, UpdateTransactionBody } from "@/domain/transactions/transaction.schemas";

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

export async function createManyTransactionRecords(
  userId: string,
  transactions: Array<{ body: CreateTransactionBody; occurredAt: Date }>
) {
  return prisma.transaction.createMany({
    data: transactions.map(({ body, occurredAt }) => ({
      ledgerId: body.ledgerId,
      userId,
      occurredAt,
      direction: body.direction,
      amountEur: body.amountEur,
      category: body.category,
      description: body.description ?? null,
    })),
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

export async function updateTransactionRecord(
  transactionId: string,
  body: UpdateTransactionBody
) {
  const updateData: any = {};

  if (body.amountEur !== undefined) updateData.amountEur = body.amountEur;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.occurredAt !== undefined) updateData.occurredAt = body.occurredAt;
  if (body.direction !== undefined) updateData.direction = body.direction;

  return prisma.transaction.update({
    where: { id: transactionId },
    data: updateData,
  });
}
