import { prisma } from "@/lib/api/db";
import { ConflictError } from "@/lib/api/errors";
import { Prisma } from "@prisma/client";
import type { CreateLedgerBody } from "@/schemas/ledger.schemas";

export async function createLedger(userId: string, data: CreateLedgerBody) {
  try {
    return await prisma.ledger.create({
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
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError(
        "LEDGER_ALREADY_EXISTS",
        "A ledger with that name and type already exists"
      );
    }
    throw e;
  }
}

export async function listLedgers(userId: string) {
  return prisma.ledger.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}
