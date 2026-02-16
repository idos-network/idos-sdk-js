/**
 * Safely parses JSON string with fallback to empty object
 * @param json - JSON string to parse (can be null or undefined)
 * @returns Parsed object or empty object if parsing fails
 * @template T - Expected return type (defaults to Record<string, unknown>)
 */
export const safeParse = <T = Record<string, unknown>>(json?: string | null): T => {
  try {
    return JSON.parse(json ?? "{}") as T;
  } catch (_e) {
    return {} as T;
  }
};
