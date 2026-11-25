import { getConfig } from "@/core/config";

export async function createFaceSignProvider() {
  const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");

  const enclaveUrl = getConfig().faceSignEnclaveUrl;
  if (!enclaveUrl) {
    throw new Error("FaceSign is not available. Please try again later.");
  }

  return new FaceSignSignerProvider({
    metadata: {
      name: "idOS Dashboard",
      description: "FaceSign signer for idOS Dashboard",
    },
    enclaveUrl,
  });
}
