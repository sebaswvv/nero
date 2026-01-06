import { prisma } from "@/lib/api/db";

// get API key from request headers
export function getApiKey(req: Request): string | null {
  const key = req.headers.get("x-api-key");
  return key && key.trim().length > 0 ? key.trim() : null;
}

// get the user id associated with the API key
export async function getUserIdFromApiKey(apiKey: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true },
  });
  return user ? user.id : null;
}
