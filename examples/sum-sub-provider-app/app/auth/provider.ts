import { SiweMessage } from "siwe";

// Authorization function for crypto login
//  takes publicAdress and signature from credentials and returns
//  either a user object on success or null on failure
export async function authorizeCrypto(
  credentials: Partial<Record<"message" | "signature", unknown>>,
  request: Request,
) {
  try {
    const siwe = new SiweMessage(JSON.parse((credentials?.message as string) || "{}"));
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);

    // This is ugly, but for demo it works
    const nonce = request.headers
      .get("cookie")
      ?.split("; ")
      .find((c) => c.startsWith("__Host-authjs.csrf-token="))
      ?.split("=")[1]
      ?.split("%")[0];

    const result = await siwe.verify({
      signature: (credentials?.signature as string) || "",
      domain: nextAuthUrl.host,
      scheme: nextAuthUrl.protocol.replace(":", ""),
      nonce,
    });

    if (result.success) {
      return {
        id: siwe.address,
      };
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}
