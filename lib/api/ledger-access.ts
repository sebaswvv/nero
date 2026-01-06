import { prisma } from "@/lib/api/db";
import { ForbiddenError } from "@/lib/api/errors";

export async function requireLedgerAccess(userId: string, ledgerId: string) {
  const member = await prisma.ledgerMember.findUnique({
    where: { ledgerId_userId: { ledgerId, userId } },
  });
  if (!member) throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");
  return member;
}
