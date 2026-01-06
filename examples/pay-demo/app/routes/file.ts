import { base85ToFile } from "@idos-network/credentials/utils";
import { fileTypeFromBuffer } from "file-type";
import { verifyFileUrl } from "~/providers/files.server";
import { getCredentialShared } from "~/providers/idos.server";
import type { Route } from "./+types/auth";

// Create a new user session
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw new Error("Token query parameter is required");
  }

  try {
    const decoded = await verifyFileUrl(token);
    const credentials = await getCredentialShared(decoded.credentialId);

    // Decode the file
    const encodedFile =
      credentials.credentialSubject[decoded.fileType as keyof typeof credentials.credentialSubject];

    if (!encodedFile || typeof encodedFile !== "string") {
      throw new Error("File not found in credential");
    }

    const file = base85ToFile(encodedFile);

    if (!file) {
      throw new Error("File not found");
    }

    const typeFromBuffer = await fileTypeFromBuffer(file);
    const mimeType = typeFromBuffer?.mime ?? "application/pdf";

    // biome-ignore lint/suspicious/noExplicitAny: false positive as of now.
    return new Response(file as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": file.length.toString(),
      },
    });
  } catch (error) {
    return Response.json({
      error: (error as Error).message,
      status: 400,
    });
  }
}
