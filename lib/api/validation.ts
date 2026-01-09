import { z } from "zod";
import { toErrorResponse } from "@/lib/api/http";
import { BadRequestError } from "@/lib/api/errors";

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  // get the json body
  try {
    raw = await req.json();
  } catch {
    throw new BadRequestError("INVALID_JSON", "Invalid JSON body");
  }

  // try to parse the body and validate it
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
  // get the url params
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    obj[key] = value;
  });

  // try to parse and validate the params
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
  // try to parse and validate the params
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new BadRequestError("VALIDATION_ERROR", result.error.message);
  }
  return result.data;
}

// wrapper to handle errors in route handlers
export async function routeHandler(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    return toErrorResponse(e);
  }
}
