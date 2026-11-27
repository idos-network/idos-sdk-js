import { CONTEXT_IDOS_CREDENTIAL_V2_EDD } from "../../utils/loader";
import { EddV1 } from "../EddV1";

/**
 * EddV1's fields under a subject context that gives every field an explicit IRI in the idOS
 * vocabulary.
 */
export class EddV2 extends EddV1 {
  static override readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V2_EDD;
}
