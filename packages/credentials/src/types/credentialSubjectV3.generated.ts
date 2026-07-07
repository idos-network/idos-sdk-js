export const CredentialSubjectSchema: z.ZodObject<{
      person: typeof personSchema;
  contact: typeof contactSchema;
  biometric: typeof biometricSchema;
  idDocument: typeof idDocumentSchema;
  residentialAddress: typeof residentialAddressSchema;
  screening: typeof screeningSchema;
  edd: typeof eddSchema;
  sourceOfWealth: typeof sourceOfWealthSchema;
    }> = z.object({person,[object Object],contact,[object Object],biometric,[object Object],idDocument,[object Object],residentialAddress,[object Object],screening,[object Object],edd,[object Object],sourceOfWealth,[object Object])

  export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;
