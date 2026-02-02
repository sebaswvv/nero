import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Get IDs from command line arguments or environment variables
const args = process.argv.slice(2);
let LEDGER_ID: string | undefined;
let USER_ID: string | undefined;

// Parse command line arguments: --ledger-id=xxx --user-id=xxx
for (const arg of args) {
  if (arg.startsWith("--ledger-id=")) {
    LEDGER_ID = arg.split("=")[1];
  } else if (arg.startsWith("--user-id=")) {
    USER_ID = arg.split("=")[1];
  }
}

// Fallback to environment variables
LEDGER_ID = LEDGER_ID || process.env.LEDGER_ID;
USER_ID = USER_ID || process.env.USER_ID;

const categories = [
  "groceries",
  "eating_out",
  "going_out",
  "transport",
  "clothing",
  "health_and_fitness",
  "other",
  "gifts",
  "incidental_income",
] as const;

const expenseCategories = categories.filter((c) => c !== "incidental_income");
const incomeCategories = ["incidental_income"] as const;

async function main() {
  console.log("🌱 Starting database seed...");

  // Validate required IDs
  if (!LEDGER_ID || !USER_ID) {
    console.error("❌ Missing required parameters!");
    console.error("");
    console.error("Usage:");
    console.error("  npm run seed -- --ledger-id=<ledger_id> --user-id=<user_id>");
    console.error("");
    console.error("Or set environment variables:");
    console.error("  LEDGER_ID=<ledger_id> USER_ID=<user_id> npm run seed");
    console.error("");
    console.error("To get your IDs, query the database:");
    console.error("  - User ID: SELECT id FROM \"User\" LIMIT 1;");
    console.error("  - Ledger ID: SELECT id FROM \"Ledger\" LIMIT 1;");
    process.exit(1);
  }

  // Verify the IDs exist in the database
  console.log(`📋 Using Ledger ID: ${LEDGER_ID}`);
  console.log(`👤 Using User ID: ${USER_ID}`);

  const ledger = await prisma.ledger.findUnique({
    where: { id: LEDGER_ID },
  });
  
  const user = await prisma.user.findUnique({
    where: { id: USER_ID },
  });

  if (!ledger) {
    console.error(`❌ Ledger with ID ${LEDGER_ID} not found in database!`);
    process.exit(1);
  }

  if (!user) {
    console.error(`❌ User with ID ${USER_ID} not found in database!`);
    process.exit(1);
  }

  console.log(`✅ Found ledger: ${ledger.name}`);
  console.log(`✅ Found user: ${user.email || user.name || user.id}`);

  // clear existing data for this ledger
  console.log("🧹 Clearing existing transactions and recurring items...");
  await prisma.transaction.deleteMany({
    where: { ledgerId: LEDGER_ID },
  });
  await prisma.recurringItem.deleteMany({
    where: { ledgerId: LEDGER_ID },
  });

  // seed transactions for the last 6 months
  console.log("💰 Seeding transactions...");
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const transactions = [];
  let currentDate = new Date(sixMonthsAgo);

  while (currentDate <= now) {
    // generate 3-8 random expense transactions per day
    const numTransactions = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < numTransactions; i++) {
      const randomCategory =
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

      // different amount ranges for different categories
      let minAmount = 5;
      let maxAmount = 50;

      if (randomCategory === "groceries") {
        minAmount = 10;
        maxAmount = 120;
      } else if (randomCategory === "eating_out") {
        minAmount = 8;
        maxAmount = 60;
      } else if (randomCategory === "going_out") {
        minAmount = 15;
        maxAmount = 100;
      } else if (randomCategory === "transport") {
        minAmount = 3;
        maxAmount = 80;
      } else if (randomCategory === "clothing") {
        minAmount = 20;
        maxAmount = 200;
      } else if (randomCategory === "health_and_fitness") {
        minAmount = 10;
        maxAmount = 150;
      }

      const amount = (Math.random() * (maxAmount - minAmount) + minAmount).toFixed(2);

      transactions.push({
        ledgerId: LEDGER_ID,
        userId: USER_ID,
        occurredAt: new Date(currentDate),
        direction: "expense" as const,
        amountEur: amount,
        category: randomCategory,
        description: generateDescription(randomCategory),
      });
    }

    // occasionally add an incidental income transaction
    if (Math.random() > 0.85) {
      const amount = (Math.random() * 200 + 20).toFixed(2);
      transactions.push({
        ledgerId: LEDGER_ID,
        userId: USER_ID,
        occurredAt: new Date(currentDate),
        direction: "income" as const,
        amountEur: amount,
        category: "incidental_income" as const,
        description: generateIncomeDescription(),
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await prisma.transaction.createMany({
    data: transactions,
  });
  console.log(`✅ Created ${transactions.length} transactions`);

  // seed recurring items
  console.log("🔄 Seeding recurring items...");

  const recurringExpenses = [
    { name: "Rent", amountEur: "1200.00" },
    { name: "Utilities", amountEur: "120.00" },
    { name: "Internet", amountEur: "45.00" },
    { name: "Phone", amountEur: "25.00" },
    { name: "Gym Membership", amountEur: "35.00" },
    { name: "Streaming Services", amountEur: "28.00" },
    { name: "Insurance", amountEur: "85.00" },
  ];

  const recurringIncome = [
    { name: "Salary", amountEur: "3500.00" },
    { name: "Freelance Projects", amountEur: "500.00" },
  ];

  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);

  for (const expense of recurringExpenses) {
    await prisma.recurringItem.create({
      data: {
        ledgerId: LEDGER_ID,
        createdById: USER_ID,
        name: expense.name,
        direction: "expense",
        isActive: true,
        versions: {
          create: {
            amountEur: expense.amountEur,
            validFrom: startOfLastMonth,
            validTo: null,
            createdById: USER_ID,
          },
        },
      },
    });
  }
  console.log(`✅ Created ${recurringExpenses.length} recurring expenses`);

  for (const income of recurringIncome) {
    await prisma.recurringItem.create({
      data: {
        ledgerId: LEDGER_ID,
        createdById: USER_ID,
        name: income.name,
        direction: "income",
        isActive: true,
        versions: {
          create: {
            amountEur: income.amountEur,
            validFrom: startOfLastMonth,
            validTo: null,
            createdById: USER_ID,
          },
        },
      },
    });
  }
  console.log(`✅ Created ${recurringIncome.length} recurring income items`);

  console.log("🎉 Seed completed successfully!");
}

function generateDescription(category: string): string | null {
  const descriptions: Record<string, string[]> = {
    groceries: [
      "Weekly groceries",
      "Supermarket run",
      "Fresh produce",
      "Costco trip",
      "Corner store",
    ],
    eating_out: [
      "Lunch at cafe",
      "Dinner with friends",
      "Quick bite",
      "Restaurant meal",
      "Food delivery",
    ],
    going_out: ["Movie tickets", "Concert", "Bar night", "Entertainment", "Weekend outing"],
    transport: ["Gas", "Uber ride", "Bus pass", "Parking", "Car maintenance"],
    clothing: ["New shirt", "Shoes", "Winter coat", "Online shopping", "Wardrobe update"],
    health_and_fitness: ["Pharmacy", "Doctor visit", "Vitamins", "Fitness gear", "Health checkup"],
    gifts: ["Birthday gift", "Present", "Gift card", "Flowers", "Special occasion"],
    other: ["Miscellaneous", "Random purchase", "Unexpected expense", "Various items"],
  };

  const categoryDescriptions = descriptions[category];
  if (!categoryDescriptions) return null;

  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}

function generateIncomeDescription(): string {
  const descriptions = [
    "Side project payment",
    "Bonus",
    "Refund",
    "Gift money",
    "Sold items",
    "Consulting work",
    "Cashback",
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
