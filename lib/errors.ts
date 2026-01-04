export class ApiError extends Error {
	code: string;
	status: number;

	constructor(code: string, message: string, status = 500) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

export class UnauthorizedError extends ApiError {
	constructor(code = "UNAUTHORIZED", message = "Unauthorized") {
		super(code, message, 401);
	}
}

export class ForbiddenError extends ApiError {
	constructor(code = "FORBIDDEN", message = "Forbidden") {
		super(code, message, 403);
	}
}

export class BadRequestError extends ApiError {
	constructor(code = "BAD_REQUEST", message = "Bad request") {
		super(code, message, 400);
	}
}

export class ConflictError extends ApiError {
	constructor(code = "CONFLICT", message = "Conflict") {
		super(code, message, 409);
	}
}

export const isApiError = (err: unknown): err is ApiError =>
	typeof err === "object" && err !== null && "code" in err && "status" in err;