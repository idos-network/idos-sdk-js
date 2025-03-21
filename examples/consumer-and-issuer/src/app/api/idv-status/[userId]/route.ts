export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;

  const response = await fetch(
    `https://kraken.staging.sandbox.fractal.id/public/kyc/${userId}/status`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KRAKEN_API_KEY}`,
      },
    },
  );

  const json = await response.json();

  return new Response(JSON.stringify(json), {
    status: 200,
  });
}
