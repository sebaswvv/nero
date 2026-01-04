import { NextResponse } from "next/server";
import { isApiError } from "@/lib/errors";

// create error response
export function toErrorResponse(err: unknown) {
	if (isApiError(err)) {
		return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
	}
	console.error("Unhandled error:", err);
	return NextResponse.json({ error: "INTERNAL_ERROR", message: "Internal server error" }, { status: 500 });
}

// create JSON response
export function jsonResponse(payload: unknown, status = 200) {
	return NextResponse.json(payload, { status });
}