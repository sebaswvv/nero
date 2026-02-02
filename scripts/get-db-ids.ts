import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  console.log("🔍 Fetching database IDs...\n");

  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const ledgers = await prisma.ledger.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  if (users.length === 0) {
    console.log("❌ No users found in database!");
    console.log("   Please create a user first by signing in to the application.\n");
  } else {
    console.log("👥 Users:");
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || user.name || "(unnamed)"}`);
      console.log(`      ID: ${user.id}`);
    });
    console.log("");
  }

  if (ledgers.length === 0) {
    console.log("❌ No ledgers found in database!");
    console.log("   Please create a ledger first in the application.\n");
  } else {
    console.log("📚 Ledgers:");
    ledgers.forEach((ledger, index) => {
      console.log(`   ${index + 1}. ${ledger.name} (${ledger.type})`);
      console.log(`      ID: ${ledger.id}`);
    });
    console.log("");
  }

  if (users.length > 0 && ledgers.length > 0) {
    console.log("✅ Ready to seed!");
    console.log("\n📋 Example command:");
    console.log(`   npm run seed -- --ledger-id=${ledgers[0].id} --user-id=${users[0].id}\n`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
