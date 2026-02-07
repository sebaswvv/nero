import ExcelJS from "exceljs";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import { prisma } from "@/lib/api/db";

type Transaction = {
  id: string;
  occurredAt: Date;
  direction: string;
  amountEur: string;
  category: string;
  description: string | null;
};

type RecurringItem = {
  id: string;
  name: string;
  direction: string;
  isActive: boolean;
  versions: RecurringItemVersion[];
};

type RecurringItemVersion = {
  id: string;
  amountEur: string;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
};

export async function generateExportFile(userId: string, ledgerId: string): Promise<Buffer> {
  // Verify access
  await requireLedgerAccess(userId, ledgerId);

  // Calculate date range (one year back from today)
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);

  // Fetch all data
  const [transactions, recurringItems] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ledgerId,
        occurredAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.recurringItem.findMany({
      where: { ledgerId },
      include: {
        versions: {
          orderBy: { validFrom: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Separate variable and income transactions
  const variableTransactions = transactions.filter((t: Transaction) => t.direction === "expense");
  const incomeTransactions = transactions.filter((t: Transaction) => t.direction === "income");

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nero Finance";
  workbook.created = new Date();

  // Add Variable Transactions sheet
  addVariableTransactionsSheet(workbook, variableTransactions);

  // Add Recurring Items sheet
  addRecurringItemsSheet(workbook, recurringItems);

  // Add Income sheet
  addIncomeSheet(workbook, incomeTransactions);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addVariableTransactionsSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Variable Transactions");

  // Set column headers
  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Category", key: "category", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Amount (€)", key: "amount", width: 15 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  transactions.forEach((tx) => {
    sheet.addRow({
      date: tx.occurredAt,
      category: formatCategory(tx.category),
      description: tx.description || "-",
      amount: parseFloat(tx.amountEur.toString()),
    });
  });

  // Format date column
  sheet.getColumn("date").numFmt = "yyyy-mm-dd";

  // Format amount column
  sheet.getColumn("amount").numFmt = '€#,##0.00';
  sheet.getColumn("amount").alignment = { horizontal: "right" };
}

function addRecurringItemsSheet(workbook: ExcelJS.Workbook, items: RecurringItem[]) {
  const sheet = workbook.addWorksheet("Recurring Items");

  // Set column headers
  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Type", key: "type", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Amount (€)", key: "amount", width: 15 },
    { header: "Valid From", key: "validFrom", width: 15 },
    { header: "Valid To", key: "validTo", width: 15 },
    { header: "Version Date", key: "versionDate", width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  items.forEach((item) => {
    item.versions.forEach((version) => {
      sheet.addRow({
        name: item.name,
        type: formatDirection(item.direction),
        status: item.isActive ? "Active" : "Inactive",
        amount: parseFloat(version.amountEur.toString()),
        validFrom: version.validFrom,
        validTo: version.validTo || "-",
        versionDate: version.createdAt,
      });
    });
  });

  // Format date columns
  sheet.getColumn("validFrom").numFmt = "yyyy-mm-dd";
  sheet.getColumn("validTo").numFmt = "yyyy-mm-dd";
  sheet.getColumn("versionDate").numFmt = "yyyy-mm-dd hh:mm:ss";

  // Format amount column
  sheet.getColumn("amount").numFmt = '€#,##0.00';
  sheet.getColumn("amount").alignment = { horizontal: "right" };
}

function addIncomeSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Income");

  // Set column headers
  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Category", key: "category", width: 20 },
    { header: "Description", key: "description", width: 40 },
    { header: "Amount (€)", key: "amount", width: 15 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  transactions.forEach((tx) => {
    sheet.addRow({
      date: tx.occurredAt,
      category: formatCategory(tx.category),
      description: tx.description || "-",
      amount: parseFloat(tx.amountEur.toString()),
    });
  });

  // Format date column
  sheet.getColumn("date").numFmt = "yyyy-mm-dd";

  // Format amount column
  sheet.getColumn("amount").numFmt = '€#,##0.00';
  sheet.getColumn("amount").alignment = { horizontal: "right" };
}

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDirection(direction: string): string {
  return direction.charAt(0).toUpperCase() + direction.slice(1);
}
