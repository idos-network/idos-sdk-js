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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVER_ENV.RELAY_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to generate journeys");
  }

  return response.json().then((data) => data.id);
}
