import { prisma } from "@/lib/db";
import { CreateTransactionDto } from "@/types/dtos/create-transaction.dto";
import {
	UnauthorizedError,
	ForbiddenError,
	BadRequestError,
	ConflictError,
} from "@/lib/errors";
import { Prisma } from "@prisma/client";

export async function createTransaction(
	apiKey: string,
	body: CreateTransactionDto
) {
	// get the user by API key
	const user = await prisma.user.findUnique({
		where: { apiKey },
		select: { id: true },
	});
	if (!user)
		throw new UnauthorizedError("INVALID_API_KEY", "Invalid API key");

	// check ledger access
	const member = await prisma.ledgerMember.findUnique({
		where: {
			ledgerId_userId: {
				ledgerId: body.ledgerId,
				userId: user.id,
			},
		},
	});
	if (!member)
		throw new ForbiddenError("NO_LEDGER_ACCESS", "No access to ledger");

	// validate amount
	if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
		throw new BadRequestError(
			"INVALID_AMOUNT",
			"amountCents must be a positive integer"
		);
	}

	// validate date
	const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
	if (Number.isNaN(occurredAt.getTime())) {
		throw new BadRequestError("INVALID_DATE", "occurredAt must be a valid date");
	}

	// idempotency: if idempotencyKey provided, return existing transaction if any
	if (body.idempotencyKey) {
		const existing = await prisma.transaction.findUnique({
			where: {
				ledgerId_idempotencyKey: {
					ledgerId: body.ledgerId,
					idempotencyKey: body.idempotencyKey,
				},
			},
		});
		if (existing) return existing;
	}

	// create transaction
	try {
		return await prisma.transaction.create({
			data: {
				ledgerId: body.ledgerId,
				userId: user.id,
				occurredAt,
				direction: body.direction ?? "expense",
				amountCents: body.amountCents,
				category: body.category,
				description: body.description ?? null,
				merchant: body.merchant ?? null,
				idempotencyKey: body.idempotencyKey ?? null,
			},
		});
	} catch (e) {
		// catch unique constraint or other Prisma errors
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
			throw new ConflictError("UNIQUE_CONSTRAINT", "Unique constraint violation");
		}
		throw e;
	}
}
