export function serializePayload(payload: unknown): Record<string, unknown> | undefined {
  if (payload === null || payload === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return undefined;
  }
}
