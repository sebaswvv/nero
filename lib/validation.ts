import { z } from "zod";
import { toErrorResponse } from "@/lib/http";
import { BadRequestError } from "@/lib/errors";

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new BadRequestError("INVALID_JSON", "Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new BadRequestError("VALIDATION_ERROR", result.error.message);
  }
  return result.data;
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema
): z.infer<TSchema> {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    obj[key] = value;
  });

  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new BadRequestError("VALIDATION_ERROR", result.error.message);
  }
  return result.data;
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  params: unknown,
  schema: TSchema
): z.infer<TSchema> {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new BadRequestError("VALIDATION_ERROR", result.error.message);
  }
  return result.data;
}

export async function routeHandler(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    return toErrorResponse(e);
  }
}
