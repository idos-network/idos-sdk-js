import { idOSConsumer } from "@/consumer.config";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;
  const consumer = await idOSConsumer();

  const { grants } = await consumer.getGrants({
    user_id: userId,
  });
  const grant = grants.find((grant) => grant.ownerUserId === userId);

  if (!grant) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  const credential = await consumer.getReusableCredentialCompliantly(grant.dataId);
  if (!credential) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  return new Response(JSON.stringify(credential), {
    status: 200,
  });
}
