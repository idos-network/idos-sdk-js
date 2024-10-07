import { Utils } from "@kwilteam/kwil-js";

// biome-ignore lint/suspicious/noExplicitAny: Using `any` is fine over here as we don't need to be strict about types being passed in.
export function createActionInput(params: Record<string, any>): Utils.ActionInput {
  const prefixedEntries = Object.entries(params).map(([key, value]) => [`$${key}`, value]);
  const prefixedObject = Object.fromEntries(prefixedEntries);
  return Utils.ActionInput.fromObject(prefixedObject);
}
