export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createRecurringItemVersion } from "@/services/recurring.service";
import { toErrorResponse, jsonResponse } from "@/lib/http";
import { CreateRecurringVersionDto } from "@/types/dtos/create-recurring.dto";

// POST /api/recurring-items/[id]/versions
export async function POST(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return toErrorResponse(new Error("Unauthorized"));
  }

  // await params from context
  const params = await (context?.params ?? {});
  const id = params?.id;
  if (!id) {
    return toErrorResponse(new Error("Missing id param"));
  }

  let body: CreateRecurringVersionDto;
  try {
    body = (await req.json()) as CreateRecurringVersionDto;
  } catch (e) {
    return toErrorResponse(new Error("Invalid JSON body"));
  }

  try {
    const version = await createRecurringItemVersion(session.user.id, id, body);
    return jsonResponse(version, 201);
  } catch (e) {
    return toErrorResponse(e);
  }
}
