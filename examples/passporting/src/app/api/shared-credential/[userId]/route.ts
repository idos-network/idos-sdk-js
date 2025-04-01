import { idOSConsumer } from "@/consumer.config";
import { getGrants } from "@idos-network/core/kwil-actions";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;
  const consumer = await idOSConsumer();

  const grants = await getGrants(consumer.kwilClient, {
    user_id: userId,
  });
  const dag = grants.find((grant) => grant.ag_owner_user_id === userId);

  if (!dag) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  const credential = await consumer.getReusableCredentialCompliantly(dag.data_id);
  if (!credential) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  return new Response(JSON.stringify(credential), {
    status: 200,
  });
}
