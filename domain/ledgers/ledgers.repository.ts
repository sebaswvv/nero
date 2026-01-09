import { prisma } from "@/lib/api/db";
import type { CreateLedgerBody } from "@/domain/ledgers/ledgers.schemas";

export async function createLedgerRecord(userId: string, data: CreateLedgerBody) {
  return prisma.ledger.create({
    data: {
      name: data.name,
      type: data.type,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });
}

export async function listLedgerRecordsForUser(userId: string) {
  return prisma.ledger.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}
