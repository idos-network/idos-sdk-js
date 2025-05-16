import type { KwilActionClient } from "../kwil-infra";
import type { idOSUserAttribute } from "../types";

/**
 * Returns all the attributes for the given `signer`.
 */
export async function getAttributes(kwilClient: KwilActionClient): Promise<idOSUserAttribute[]> {
  return kwilClient.call<idOSUserAttribute[]>({
    name: "get_attributes",
    inputs: {},
  });
}

/**
 * Creates a new attribute for the given `signer`.
 */
export async function createAttribute(
  kwilClient: KwilActionClient,
  attribute: idOSUserAttribute,
): Promise<idOSUserAttribute> {
  await kwilClient.execute({
    name: "add_attribute",
    description: "Create a new attribute in your idOS profile",
    inputs: attribute,
  });

  return attribute;
}
