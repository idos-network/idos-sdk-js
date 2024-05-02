import fractal_id from "./cachedSchemas/fractal_id";
import w3_2018_credentials_v1 from "./cachedSchemas/w3_2018_credentials_v1";
import w3_ns_credentials_v2 from "./cachedSchemas/w3_ns_credentials_v2";
import w3id_security_suitesed255192020_v1 from "./cachedSchemas/w3id_security_suitesed255192020_v1";

export default {
  "https://www.w3.org/2018/credentials/v1": w3_2018_credentials_v1,
  "https://www.w3.org/ns/credentials/v2": w3_ns_credentials_v2,
  "https://raw.githubusercontent.com/trustfractal/claim-schemas/master/verifiable_credential/fractal_id.json-ld":
    fractal_id,
  "https://w3id.org/security/suites/ed25519-2020/v1": w3id_security_suitesed255192020_v1,
};
