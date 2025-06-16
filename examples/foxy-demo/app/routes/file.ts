import { verifyFileUrl } from "~/providers/files.server";
import { getSharedCredential } from "~/providers/idos.server";
import type { Route } from "./+types/auth";

// @ts-expect-error
import * as ascii85 from "ascii85";

import { fileTypeFromBuffer } from "file-type";

// Create a new user session
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw new Error("Token query parameter is required");
  }

  try {
    const decoded = await verifyFileUrl(token);
    const credentials = await getSharedCredential(decoded.credentialId);

    // Decode the file
    const encodedFile = credentials.credentialSubject[decoded.fileType];
    const instance = new ascii85.default.Ascii85();
    const file = instance.decode(encodedFile);

    if (!file) {
      throw new Error("File not found");
    }

    const typeFromBuffer = await fileTypeFromBuffer(file);
    const mimeType = typeFromBuffer?.mime ?? "application/pdf";

    return new Response(file, {
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
