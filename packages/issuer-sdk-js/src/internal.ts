import { Utils } from "@kwilteam/kwil-js";

export function createActionInput(params: Record<string, string>): Utils.ActionInput {
  const prefixedEntries = Object.entries(params).map(([key, value]) => [`$${key}`, value]);
  const prefixedObject = Object.fromEntries(prefixedEntries);
  return Utils.ActionInput.fromObject(prefixedObject);
}
