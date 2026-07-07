import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const CredentialSubjectBiometricSchema: z.ZodObject<{
  selfieFile: z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>;
  selfieMatch: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  /* The person's selfie image. */
  selfieFile: z.instanceof(Buffer),

  /* A score or flag indicating whether the selfie/liveness photo matches the identity document photo. */
  selfieMatch: z.number().optional(),
});

export type CredentialSubjectBiometric = z.infer<typeof CredentialSubjectBiometricSchema>;
