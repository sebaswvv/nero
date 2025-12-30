import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

// POST /api/ledgers
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, type } = body as { name: string; type: "personal" | "household" };

  if (!name || !type) {
    return NextResponse.json({ error: "name and type required" }, { status: 400 });
  }

  const ledger = await prisma.ledger.create({
    data: {
      name,
      type,
      members: {
        create: {
          userId: userId,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json(ledger, { status: 201 });
}

// GET /api/ledgers
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledgers = await prisma.ledger.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(ledgers);
}
