import { prisma } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";

export async function requireLedgerAccess(userId: string, ledgerId: string) {
  const member = await prisma.ledgerMember.findUnique({
    where: { ledgerId_userId: { ledgerId, userId } },
  });
  if (!member) throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");
  return member;
}
