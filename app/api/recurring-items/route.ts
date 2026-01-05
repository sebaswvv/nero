export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createRecurringItem, listRecurringItems } from "@/services/recurring.service";
import { toErrorResponse, jsonResponse } from "@/lib/http";
import { CreateRecurringDto } from "@/types/dtos/create-recurring.dto";

// POST /api/recurring-items
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return toErrorResponse(new Error("Unauthorized"));
  }

  let body: CreateRecurringDto;
  try {
    body = (await req.json()) as CreateRecurringDto;
  } catch (e) {
    return toErrorResponse(new Error("Invalid JSON body"));
  }

  try {
    const item = await createRecurringItem(session.user.id, body);
    return jsonResponse(item, 201);
  } catch (e) {
    return toErrorResponse(e);
  }
}

// GET /api/recurring-items?ledgerId=...
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return toErrorResponse(new Error("Unauthorized"));
  }

  const url = new URL(req.url);
  const ledgerId = url.searchParams.get("ledgerId");
  if (!ledgerId) {
    return toErrorResponse(new Error("ledgerId is required"));
  }

  try {
    const items = await listRecurringItems(session.user.id, ledgerId);
    return jsonResponse(items);
  } catch (e) {
    return toErrorResponse(e);
  }
  }
