import { idOSConsumer } from "@/consumer.config";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;
  const consumer = await idOSConsumer();

  const { grants } = await consumer.getAccessGrants({
    user_id: userId,
  });
  const grant = grants.find((grant) => grant.ag_owner_user_id === userId);

  if (!grant) {
    return new Response(JSON.stringify({ credential: null, cause: "no-grant" }), {
      status: 200,
    });
  }

  const credential = await consumer.getReusableCredentialCompliantly(grant.data_id);
  if (!credential) {
    return new Response(JSON.stringify({ credential: null, cause: "no-credential" }), {
      status: 200,
    });
  }

  return new Response(JSON.stringify({ credential, cause: "success" }), {
    status: 200,
  });
}
