import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/api/auth-options";
import { UnauthorizedError } from "@/lib/api/errors";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new UnauthorizedError("UNAUTHORIZED", "Unauthorized");
  return userId;
}
