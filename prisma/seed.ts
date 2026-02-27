import "dotenv/config";
import { PrismaClient, type Category, type TransactionDirection } from "@prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const args = process.argv.slice(2);
let LEDGER_ID: string | undefined;
let USER_ID: string | undefined;

for (const arg of args) {
  if (arg.startsWith("--ledger-id=")) {
    LEDGER_ID = arg.split("=")[1];
  } else if (arg.startsWith("--user-id=")) {
    USER_ID = arg.split("=")[1];
  }
}

LEDGER_ID = LEDGER_ID || process.env.LEDGER_ID;
USER_ID = USER_ID || process.env.USER_ID;

const recurringItems: Array<{
  name: string;
  direction: TransactionDirection;
  amountEur: string;
}> = [
  { name: "Energie thuis", direction: "expense", amountEur: "25.00" },
  { name: "Eteck", direction: "expense", amountEur: "120.00" },
  { name: "Fietsverzekering", direction: "expense", amountEur: "6.99" },
  { name: "Gym", direction: "expense", amountEur: "80.00" },
  { name: "Huur", direction: "expense", amountEur: "475.00" },
  { name: "Huurtoeslag", direction: "income", amountEur: "272.00" },
  { name: "Internet thuis", direction: "expense", amountEur: "20.00" },
  { name: "Kleedgeld", direction: "income", amountEur: "107.00" },
  { name: "PWN", direction: "expense", amountEur: "19.00" },
  { name: "Reisverzekering", direction: "expense", amountEur: "4.16" },
  { name: "Telefoon abonnement", direction: "expense", amountEur: "17.00" },
  { name: "Zorg verzekering", direction: "expense", amountEur: "148.00" },
  { name: "Zorgtoeslag", direction: "income", amountEur: "129.00" },
];

const variableTransactions: Array<{
  occurredAt: string;
  category: Category;
  amountEur: string;
  description: string;
}> = [
  { occurredAt: "2026-02-27T09:47:00.000Z", category: "groceries", amountEur: "6.00", description: "groceries" },
  { occurredAt: "2026-02-26T16:37:00.000Z", category: "going_out", amountEur: "20.00", description: "Kaartjes basis" },
  { occurredAt: "2026-02-24T08:33:00.000Z", category: "groceries", amountEur: "7.13", description: "Albert Heijn" },
  { occurredAt: "2026-02-23T20:56:00.000Z", category: "groceries", amountEur: "10.00", description: "Appie" },
  { occurredAt: "2026-02-22T15:37:00.000Z", category: "eating_out", amountEur: "12.00", description: "Maccie" },
  { occurredAt: "2026-02-22T01:00:00.000Z", category: "eating_out", amountEur: "3.50", description: "Maccie" },
  { occurredAt: "2026-02-21T18:40:00.000Z", category: "going_out", amountEur: "12.00", description: "Vue" },
  { occurredAt: "2026-02-19T01:00:00.000Z", category: "gifts", amountEur: "12.75", description: "Cadeau Paula" },
  { occurredAt: "2026-02-19T01:00:00.000Z", category: "health_and_fitness", amountEur: "9.75", description: "Padel" },
  { occurredAt: "2026-02-19T01:00:00.000Z", category: "groceries", amountEur: "25.00", description: "groceries" },
  { occurredAt: "2026-02-18T12:21:00.000Z", category: "other", amountEur: "5.00", description: "Batterij" },
  { occurredAt: "2026-02-18T12:09:00.000Z", category: "health_and_fitness", amountEur: "16.00", description: "Whey" },
  { occurredAt: "2026-02-18T01:00:00.000Z", category: "groceries", amountEur: "7.73", description: "groceries" },
  { occurredAt: "2026-02-17T14:42:00.000Z", category: "groceries", amountEur: "12.00", description: "groceries" },
  { occurredAt: "2026-02-16T13:17:00.000Z", category: "groceries", amountEur: "9.00", description: "groceries" },
  { occurredAt: "2026-02-16T09:45:00.000Z", category: "groceries", amountEur: "11.70", description: "groceries" },
  { occurredAt: "2026-02-15T22:35:00.000Z", category: "other", amountEur: "10.00", description: "Boek" },
  { occurredAt: "2026-02-15T22:22:00.000Z", category: "other", amountEur: "20.00", description: "Luns" },
  { occurredAt: "2026-02-15T14:47:00.000Z", category: "other", amountEur: "10.00", description: "Lamp" },
  { occurredAt: "2026-02-15T14:17:00.000Z", category: "going_out", amountEur: "6.50", description: "going out" },
  { occurredAt: "2026-02-14T14:39:00.000Z", category: "gifts", amountEur: "20.00", description: "Oma" },
  { occurredAt: "2026-02-14T01:30:00.000Z", category: "going_out", amountEur: "4.00", description: "Drankje" },
  { occurredAt: "2026-02-13T11:32:00.000Z", category: "transport", amountEur: "143.00", description: "NS" },
  { occurredAt: "2026-02-12T17:03:00.000Z", category: "eating_out", amountEur: "5.00", description: "FEBO" },
  { occurredAt: "2026-02-12T16:08:00.000Z", category: "other", amountEur: "5.00", description: "Koffietje" },
  { occurredAt: "2026-02-11T15:36:00.000Z", category: "groceries", amountEur: "8.00", description: "groceries" },
  { occurredAt: "2026-02-11T13:09:00.000Z", category: "groceries", amountEur: "9.50", description: "groceries" },
  { occurredAt: "2026-02-10T12:46:00.000Z", category: "groceries", amountEur: "2.00", description: "groceries" },
  { occurredAt: "2026-02-10T12:46:00.000Z", category: "groceries", amountEur: "9.00", description: "groceries" },
  { occurredAt: "2026-02-10T12:27:00.000Z", category: "clothing", amountEur: "3.50", description: "Valentijns dag" },
  { occurredAt: "2026-02-10T12:17:00.000Z", category: "other", amountEur: "40.00", description: "Kapper" },
  { occurredAt: "2026-02-09T21:33:00.000Z", category: "health_and_fitness", amountEur: "50.00", description: "Sportschoenen" },
  { occurredAt: "2026-02-09T11:25:00.000Z", category: "groceries", amountEur: "3.50", description: "groceries" },
  { occurredAt: "2026-02-07T18:03:00.000Z", category: "going_out", amountEur: "85.00", description: "Soendaaaa" },
  { occurredAt: "2026-02-07T15:16:00.000Z", category: "groceries", amountEur: "19.40", description: "groceries" },
  { occurredAt: "2026-02-07T11:29:00.000Z", category: "groceries", amountEur: "4.00", description: "groceries" },
  { occurredAt: "2026-02-06T19:33:00.000Z", category: "groceries", amountEur: "5.00", description: "groceries" },
  { occurredAt: "2026-02-05T17:19:00.000Z", category: "groceries", amountEur: "9.00", description: "groceries" },
  { occurredAt: "2026-02-05T14:22:00.000Z", category: "clothing", amountEur: "30.00", description: "clothing" },
  { occurredAt: "2026-02-04T17:27:00.000Z", category: "groceries", amountEur: "9.00", description: "groceries" },
  { occurredAt: "2026-02-02T19:54:00.000Z", category: "going_out", amountEur: "55.00", description: "Joey" },
  { occurredAt: "2026-02-02T16:10:00.000Z", category: "groceries", amountEur: "28.00", description: "groceries" },
  { occurredAt: "2026-02-01T15:31:00.000Z", category: "groceries", amountEur: "5.17", description: "groc" },
];

async function resolveSeedTargets() {
  if (LEDGER_ID && USER_ID) {
    const [ledger, user] = await Promise.all([
      prisma.ledger.findUnique({ where: { id: LEDGER_ID } }),
      prisma.user.findUnique({ where: { id: USER_ID } }),
    ]);

    if (!ledger) {
      throw new Error(`Ledger with ID ${LEDGER_ID} not found.`);
    }
    if (!user) {
      throw new Error(`User with ID ${USER_ID} not found.`);
    }

    await prisma.ledgerMember.upsert({
      where: {
        ledgerId_userId: {
          ledgerId: ledger.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        ledgerId: ledger.id,
        userId: user.id,
        role: "editor",
      },
    });

    return { ledgerId: ledger.id, userId: user.id };
  }

  const user = await prisma.user.upsert({
    where: { email: "seed.user@nero.local" },
    update: { name: "Seed User" },
    create: {
      email: "seed.user@nero.local",
      name: "Seed User",
    },
  });

  const ledger = await prisma.ledger.upsert({
    where: {
      name_type: {
        name: "Seed Ledger",
        type: "personal",
      },
    },
    update: {},
    create: {
      name: "Seed Ledger",
      type: "personal",
    },
  });

  await prisma.ledgerMember.upsert({
    where: {
      ledgerId_userId: {
        ledgerId: ledger.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      ledgerId: ledger.id,
      userId: user.id,
      role: "editor",
    },
  });

  return { ledgerId: ledger.id, userId: user.id };
}

async function main() {
  console.log("Starting database seed...");
  const { ledgerId, userId } = await resolveSeedTargets();
  console.log(`Using ledger: ${ledgerId}`);
  console.log(`Using user: ${userId}`);

  await prisma.budgetAllocation.deleteMany({ where: { ledgerId } });
  await prisma.transaction.deleteMany({ where: { ledgerId } });
  await prisma.recurringItem.deleteMany({ where: { ledgerId } });

  const validFrom = new Date("2026-02-01T00:00:00.000Z");

  for (const item of recurringItems) {
    await prisma.recurringItem.create({
      data: {
        ledgerId,
        createdById: userId,
        name: item.name,
        direction: item.direction,
        isActive: true,
        versions: {
          create: {
            amountEur: item.amountEur,
            validFrom,
            validTo: null,
            createdById: userId,
          },
        },
      },
    });
  }

  await prisma.transaction.createMany({
    data: variableTransactions.map((transaction) => ({
      ledgerId,
      userId,
      occurredAt: new Date(transaction.occurredAt),
      direction: "expense",
      amountEur: transaction.amountEur,
      category: transaction.category,
      description: transaction.description,
    })),
  });

  console.log(`Created ${recurringItems.length} recurring items`);
  console.log(`Created ${variableTransactions.length} variable transactions`);
  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Error during seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
