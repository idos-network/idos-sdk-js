import type { idOSUserAttribute } from "../types";
import type { KwilActionClient } from "./create-kwil-client";

/**
 * Returns all the attributes for the given `signer`.
 */
export async function getAttributes(kwilClient: KwilActionClient) {
  return kwilClient.call<Record<string, unknown>[]>({
    name: "get_attributes",
  });
}

/**
 * Creates a new attribute for the given `signer`.
 */
export async function createAttribute(kwilClient: KwilActionClient, attribute: idOSUserAttribute) {
  return kwilClient.execute({
    name: "add_attribute",
    description: "Create a new attribute",
    inputs: attribute,
  });
}
