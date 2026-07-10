import type { VerifyCredentialResult } from "./verifier";

import { VerifiableCredentialKycV3 } from "../schemas/Kyc/v3";
import { verifyCredential } from "./verifier";

const builders: {
  kyc: {
    v3: typeof VerifiableCredentialKycV3;
    latest: typeof VerifiableCredentialKycV3;
  };
} = {
  kyc: {
    v3: VerifiableCredentialKycV3,
    latest: VerifiableCredentialKycV3,
  },
};

export type { VerifyCredentialResult };
export { verifyCredential };

export default builders;
