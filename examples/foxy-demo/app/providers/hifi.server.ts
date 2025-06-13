import { SERVER_ENV } from "./envFlags.server";

export const fetchTosLink = async (url: URL) => {
  // Cleanup URL
  const returnUrl = new URL(url.toString());
  returnUrl.protocol = "https";
  returnUrl.pathname = "/callbacks/hifi/tos";
  returnUrl.search = "";
  returnUrl.hash = "";

  const idempotencyKey = crypto.randomUUID();

  const response = await fetch(`${SERVER_ENV.HIFI_API_URL}v2/tos-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVER_ENV.HIFI_API_KEY}`,
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
