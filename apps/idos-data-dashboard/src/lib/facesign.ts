import { COMMON_ENV } from "@/core/envFlags.common";

export async function createFaceSignProvider() {
  const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");

  const enclaveUrl = COMMON_ENV.FACESIGN_ENCLAVE_URL;
  if (!enclaveUrl) {
    throw new Error("FaceSign is not available. Please try again later.");
  }

  return new FaceSignSignerProvider({
    metadata: {
      name: "idOS Dashboard",
      description: "Add FaceSign to your idOS profile",
    },
    enclaveUrl,
  });
}
