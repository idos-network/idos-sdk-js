import { z } from "zod";

import { BiometricSchema } from "./biometric";
import { ContactSchema } from "./contact";
import { EDDSchema } from "./edd";
import { IdDocumentSchema } from "./idDocument";
import { PersonSchema } from "./person";
import { ResidentialAddressSchema } from "./residentialAddress";
import { ScreeningSchema } from "./screening";
import { SourceOfWealthSchema } from "./sow";

const mapping: Record<string, z.ZodObject<any>> = {
  person: PersonSchema,
  contact: ContactSchema,
  biometric: BiometricSchema,
  idDocument: IdDocumentSchema,
  residentialAddress: ResidentialAddressSchema,
  screening: ScreeningSchema,
  edd: EDDSchema,
  sourceOfWealth: SourceOfWealthSchema,
};

export default mapping;
