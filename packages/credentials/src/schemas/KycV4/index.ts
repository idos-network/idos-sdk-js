import { CONTEXT_IDOS_CREDENTIAL_V4_SUBJECT } from "../../utils/loader";
import { KycV3 } from "../KycV3";

/**
 * KycV3's fields under a subject context that gives every field an explicit IRI in the idOS
 * vocabulary. v4 changes only the context. The KYC v3 context is closed, so a new field can't go
 * into the shared subject classes: give v4 its own subject classes first.
 */
export class KycV4 extends KycV3 {
  static override readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V4_SUBJECT;
}
