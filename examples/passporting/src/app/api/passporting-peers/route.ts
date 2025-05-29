import { idOSConsumer } from "@/consumer.config";

export async function GET() {
  const consumer = await idOSConsumer();

  const peers = await consumer.getPassportingPeers();

  return new Response(JSON.stringify(peers), {
    status: 200,
  });
}
