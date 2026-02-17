/**
 * Safely parses JSON string with fallback to empty object.
 * Guarantees the result is a plain object, even if the JSON contains
 * an array, null, or a primitive.
 * @param json - JSON string to parse (can be null or undefined)
 * @returns Parsed object or empty object if parsing fails
 * @template T - Expected return type (defaults to Record<string, unknown>)
 */
export const safeParse = <T = Record<string, unknown>>(json?: string | null): T => {
  try {
    const parsed: unknown = JSON.parse(json ?? "{}");
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return {} as T;
  } catch {
    return {} as T;
  }
};
