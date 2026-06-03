import { SERVER_ENV } from "./envFlags.server";

export interface GenerateJourneyRequest {
  name: string;
  email: string;
  publicKey: string;
  consumerWallet: string;
  consumerEncPubKey: string;
  blockedCountries: string[];
}

export async function createRelayClient(request: GenerateJourneyRequest): Promise<string> {
  const response = await fetch(`${SERVER_ENV.RELAY_URL}/developer/console/clients`, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.RELAY_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    console.error("Relay client creation failed", {
      status: response.status,
      statusText: response.statusText,
    });

    throw new Error("Failed to generate journeys");
  }

  const data = await response.json();

  if (typeof data !== "object" || data === null || !("id" in data)) {
    throw new Error("Failed to generate journeys");
  }

  return data.id;
}
