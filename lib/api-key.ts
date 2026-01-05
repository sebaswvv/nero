// get API key from request headers
export function getApiKey(req: Request): string | null {
  const key = req.headers.get("x-api-key");
  return key && key.trim().length > 0 ? key.trim() : null;
}
