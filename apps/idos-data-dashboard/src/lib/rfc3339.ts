/** Second precision. `Date#toISOString` includes milliseconds, which add_wallet_message rejects. */
export function toSecondPrecisionIso(date: Date): string {
  return date.toISOString().replace(/\.\d+Z$/, "Z");
}
