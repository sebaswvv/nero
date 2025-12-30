import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";


// post /api/transactions
export async function POST(req: Request) {
  // ledgerId, userId verification, 
}
