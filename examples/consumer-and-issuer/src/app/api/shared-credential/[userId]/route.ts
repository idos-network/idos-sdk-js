import { idOSConsumer } from "@/consumer.config";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;

  const consumer = await idOSConsumer();
  const credentials = await consumer.getCredentialsSharedByUser(userId);

  if (!credentials.length) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  const match = credentials.find((credential) => {
    const publicNotes = JSON.parse(credential.public_notes ?? "{}");
    return publicNotes.type === "PASSPORTING_DEMO";
  });

  if (!match) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  }

  return new Response(JSON.stringify(match), {
    status: 200,
  });
}
