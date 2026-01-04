import { prisma } from "@/lib/db";
import { BadRequestError, ConflictError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export async function createLedger(userId: string, data: { name: string; type: "personal" | "household" }) {
	// validate
	if (!data.name || !data.type) {
		throw new BadRequestError("NAME_TYPE_REQUIRED", "name and type required");
	}

	try {
		return await prisma.ledger.create({
			data: {
				name: data.name,
				type: data.type,
				members: {
					create: {
						userId,
						role: "owner",
					},
				},
			},
		});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
			throw new ConflictError("LEDGER_ALREADY_EXISTS", "A ledger with that name and type already exists");
		}
		throw e;
	}
}

export async function listLedgers(userId: string) {
	return prisma.ledger.findMany({
		where: {
			members: {
				some: { userId },
			},
		},
		orderBy: { createdAt: "asc" },
	});
}
