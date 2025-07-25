import { NextResponse } from "next/server";

const fetchTosLink = async (url: URL) => {
  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/hifi";
  returnUrl.search = "";
  returnUrl.hash = "";

  const idempotencyKey = crypto.randomUUID();

  const response = await fetch(`${process.env.HIFI_API_URL}v2/tos-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HIFI_API_KEY}`,
    },
    body: JSON.stringify({
      idempotencyKey,
      templateId: "2fb2da24-472a-4e5b-b160-038d9dc82a40", // HIFI default template
      redirectUrl: returnUrl.toString(),
    }),
  });

  const data = await response.json();

  return {
    url: data.url,
    idempotencyKey,
  };
};

export async function GET(request: Request) {
  // Simulate some processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const requestUrl = new URL(request.url);
  const callbackUrl = `${requestUrl.origin}/callbacks/hifi`;

  const { url, idempotencyKey } = await fetchTosLink(new URL(callbackUrl));
  return NextResponse.json({
    link: url,
    idempotencyKey,
  });
}
