export const runtime = "nodejs";

import { routeHandler, parseQuery } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { ExportQuerySchema } from "@/domain/export/export.schemas";
import { generateExportFile } from "@/domain/export/export.service";

export async function GET(req: Request) {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const query = parseQuery(req, ExportQuerySchema);

    const buffer = await generateExportFile(userId, query.ledgerId);

    // Generate filename with current date
    const today = new Date().toISOString().split("T")[0];
    const filename = `transactions-export-${today}.xlsx`;

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  });
}
