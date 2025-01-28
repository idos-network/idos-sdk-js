import { idOSGrantee } from "@/grantee.config";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;

  const grantee = await idOSGrantee();
  const credential = await grantee.getCredentialSharedByUser(userId);

  return new Response(JSON.stringify(credential), {
    status: 200,
  });
}
