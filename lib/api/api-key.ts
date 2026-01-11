import { prisma } from "@/lib/api/db";
import crypto from "crypto";

const API_KEY_PEPPER = process.env.API_KEY_PEPPER;

if (!API_KEY_PEPPER) {
  throw new Error("Missing API_KEY_PEPPER env var");
}

export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey + API_KEY_PEPPER)
    .digest("hex");
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// get API key from request headers
export function getApiKey(req: Request): string | null {
  const key = req.headers.get("x-api-key");
  return key && key.trim().length > 0 ? key.trim() : null;
}

export async function createNewApiKeyForUser(
  userId: string
): Promise<{ apiKey: string; apiKeyHash: string }> {
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  await prisma.user.update({
    where: { id: userId },
    data: { apiKeyHash },
  });

  return { apiKey, apiKeyHash };
}

// get the user id associated with the API key
export async function getUserIdFromApiKey(apiKey: string): Promise<string | null> {
  const hash = hashApiKey(apiKey);
  const user = await prisma.user.findUnique({
    where: { apiKeyHash: hash },
    select: { id: true },
  });
  return user ? user.id : null;
}
