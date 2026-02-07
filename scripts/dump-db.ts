import "dotenv/config";
import { execSync, spawn } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

/**
 * CLI Script to dump the PostgreSQL database to a SQL file
 *
 * Usage:
 *   npm run dump          - Dump to stdout
 *   npm run dump -- --output=backup.sql   - Dump to file
 *   npm run dump -- --output=backup.sql --format=custom  - Custom format dump
 *
 * Options:
 *   --output=<filename>  - Output file path (default: stdout)
 *   --format=<format>    - Dump format: plain (default), custom, directory, tar
 *   --schema-only        - Dump only schema, no data
 *   --data-only          - Dump only data, no schema
 */

interface DumpOptions {
  output?: string;
  format?: "plain" | "custom" | "directory" | "tar";
  schemaOnly?: boolean;
  dataOnly?: boolean;
}

function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
} {
  // Handle Prisma Accelerate URL format or direct PostgreSQL URL
  let dbUrl = url;

  // If using Prisma Accelerate, extract the actual database URL
  if (url.includes("prisma://")) {
    console.error("⚠️  Warning: Prisma Accelerate URL detected.");
    console.error("   SQL dump requires a direct PostgreSQL connection URL.");
    console.error(
      "   Please set DATABASE_URL environment variable with a direct connection string."
    );
    console.error("   Format: postgresql://user:password@host:port/database\n");
    process.exit(1);
  }

  // Parse standard PostgreSQL URL: postgresql://user:password@host:port/database
  const urlPattern = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+?)(?:\?.*)?$/;
  const match = dbUrl.match(urlPattern);

  if (!match) {
    console.error("❌ Error: Invalid database URL format");
    console.error("   Expected format: postgresql://user:password@host:port/database");
    process.exit(1);
  }

  const [, username, password, host, port = "5432", database] = match;

  return {
    host,
    port,
    database,
    username,
    password: decodeURIComponent(password),
  };
}

function parseArgs(): DumpOptions {
  const args = process.argv.slice(2);
  const options: DumpOptions = {};

  for (const arg of args) {
    if (arg.startsWith("--output=")) {
      options.output = arg.split("=")[1];
    } else if (arg.startsWith("--format=")) {
      const format = arg.split("=")[1];
      if (!["plain", "custom", "directory", "tar"].includes(format)) {
        console.error(`❌ Error: Invalid format '${format}'`);
        console.error("   Valid formats: plain, custom, directory, tar");
        process.exit(1);
      }
      options.format = format as DumpOptions["format"];
    } else if (arg === "--schema-only") {
      options.schemaOnly = true;
    } else if (arg === "--data-only") {
      options.dataOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`❌ Error: Unknown argument '${arg}'`);
      printHelp();
      process.exit(1);
    }
  }

  if (options.schemaOnly && options.dataOnly) {
    console.error("❌ Error: Cannot use --schema-only and --data-only together");
    process.exit(1);
  }

  return options;
}

function printHelp() {
  console.log(`
📦 Nero Database Dump Tool

Usage:
  npm run dump                              Dump to stdout
  npm run dump -- --output=backup.sql       Dump to file
  npm run dump -- --format=custom           Use custom binary format

Options:
  --output=<filename>   Output file path (default: stdout)
  --format=<format>     Dump format: plain (default), custom, directory, tar
  --schema-only         Dump only schema, no data
  --data-only           Dump only data, no schema
  --help, -h            Show this help message

Examples:
  npm run dump -- --output=backup.sql
  npm run dump -- --output=schema.sql --schema-only
  npm run dump -- --output=backup.dump --format=custom
`);
}

function checkPgDump(): boolean {
  try {
    execSync("pg_dump --version", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

async function dumpDatabase(options: DumpOptions): Promise<void> {
  const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ Error: Database URL not found");
    console.error("   Please set PRISMA_DATABASE_URL or DATABASE_URL environment variable");
    process.exit(1);
  }

  // Check if pg_dump is available
  if (!checkPgDump()) {
    console.error("❌ Error: pg_dump not found");
    console.error("   Please install PostgreSQL client tools:");
    console.error("   - Ubuntu/Debian: sudo apt-get install postgresql-client");
    console.error("   - macOS: brew install postgresql");
    console.error("   - Windows: Download from https://www.postgresql.org/download/");
    process.exit(1);
  }

  console.log("🔍 Parsing database connection...");
  const dbConfig = parseDatabaseUrl(databaseUrl);

  // Build pg_dump command
  const args: string[] = [
    "-h",
    dbConfig.host,
    "-p",
    dbConfig.port,
    "-U",
    dbConfig.username,
    "-d",
    dbConfig.database,
  ];

  // Add format option
  if (options.format && options.format !== "plain") {
    args.push("-F", options.format === "custom" ? "c" : options.format[0]);
  }

  // Add schema/data options
  if (options.schemaOnly) {
    args.push("--schema-only");
  } else if (options.dataOnly) {
    args.push("--data-only");
  }

  // Add output file if specified
  if (options.output) {
    args.push("-f", resolve(options.output));
  }

  console.log(`📤 Dumping database '${dbConfig.database}'...`);
  if (options.output) {
    console.log(`   Output: ${resolve(options.output)}`);
  }
  if (options.format) {
    console.log(`   Format: ${options.format}`);
  }
  if (options.schemaOnly) {
    console.log("   Mode: Schema only");
  } else if (options.dataOnly) {
    console.log("   Mode: Data only");
  }
  console.log();

  // Execute pg_dump
  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  try {
    const result = execSync(`pg_dump ${args.join(" ")}`, {
      env,
      stdio: options.output ? "pipe" : "inherit",
      maxBuffer: 100 * 1024 * 1024, // 100MB buffer
    });

    if (options.output) {
      console.log("✅ Database dump completed successfully!");
      console.log(`   File: ${resolve(options.output)}`);
    }
  } catch (error: any) {
    console.error("\n❌ Error during database dump:");
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    if (error.stderr) {
      console.error(`   ${error.stderr.toString()}`);
    }
    process.exit(1);
  }
}

// Main execution
const options = parseArgs();
dumpDatabase(options).catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
