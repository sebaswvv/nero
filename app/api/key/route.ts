export const runtime = "nodejs";

import { jsonResponse } from "@/lib/api/http";
import { routeHandler } from "@/lib/api/validation";
import { requireUserId } from "@/lib/api/auth";
import { createNewApiKeyForUser } from "@/lib/api/api-key";

export async function GET() {
  return routeHandler(async () => {
    const userId = await requireUserId();
    const apiKey = await createNewApiKeyForUser(userId);

    return jsonResponse({ apiKey: apiKey.apiKey });
  });
}
