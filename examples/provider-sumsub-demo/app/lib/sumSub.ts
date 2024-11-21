import crypto from "node:crypto";

// @ts-expect-error not typed
import * as ascii85 from "ascii85";

const BASE_URL = "https://api.sumsub.com";

export const createSignature = (
  endpoint: string,
  method: string,
  secretKey: string,
  appToken: string,
) => {
  const headers = new Headers();
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", secretKey);
  signature.update(`${ts}${method}${endpoint}`);

  headers.append("Content-Type", "application/json");
  headers.append("X-App-Access-Ts", ts.toString());
  headers.append("X-App-Token", appToken);
  headers.append("X-App-Access-Sig", signature.digest("hex"));

  return headers;
};

export async function createAccessToken(userId: string, level: string) {
  const endpoint = `/resources/accessTokens?userId=${userId}&levelName=${encodeURIComponent(level)}`;

  const headers = createSignature(
    endpoint,
    "POST",
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_SECRET_KEY!,
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_API_KEY!,
  );

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    cache: "no-cache",
  });

  return response.json().then((data) => data.token);
}

export async function getData(userId: string) {
  const endpoint = `/resources/applicants/-;externalUserId=${userId}/one`;

  const headers = createSignature(
    endpoint,
    "GET",
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_SECRET_KEY!,
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_API_KEY!,
  );

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (response.status !== 200) throw new Error(`Failed to fetch data: ${response.status}`);

  return response.json();
}

export async function fetchSteps(applicantId: string) {
  const endpoint = `/resources/applicants/${applicantId}/requiredIdDocsStatus`;

  const headers = createSignature(
    endpoint,
    "GET",
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_SECRET_KEY!,
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_API_KEY!,
  );

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (response.status !== 200) throw new Error(`Failed to fetch data: ${response.status}`);

  return response.json();
}

export async function image(inspectionId: string, imageId: string) {
  const endpoint = `/resources/inspections/${inspectionId}/resources/${imageId}`;

  const headers = createSignature(
    endpoint,
    "GET",
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_SECRET_KEY!,
    // biome-ignore lint: style/noNonNullAssertion
    process.env.SUM_SUB_API_KEY!,
  );

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (response.status !== 200) throw new Error(`Failed to fetch data: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();

  return `data:image/jpeg;base85,${ascii85.encode(arrayBuffer)}`;
}

export async function fetchImages(applicantId: string, inspectionId: string) {
  const steps = await fetchSteps(applicantId);

  const images: Record<string, string> = {};

  // Map files to object with "known" keys
  for (const [key, step] of Object.entries(steps)) {
    if (key === "IDENTITY") {
      // @ts-expect-error Not yet fully typed
      images.identificationDocumentFrontFile = await image(inspectionId, step.imageIds[0]);

      // @ts-expect-error Not yet fully typed
      if (step.imageIds.length > 1) {
        // @ts-expect-error Not yet fully typed
        images.identificationDocumentBackFile = await image(inspectionId, step.imageIds[1]);
      }
    } else if (key === "SELFIE") {
      // @ts-expect-error Not yet fully typed
      images.livenessAuditBestFile = await image(inspectionId, step.imageIds[0]);
    } else if (key === "PROOF_OF_RESIDENCE") {
      // @ts-expect-error Not yet fully typed
      images.residentialAddressProofFile = await image(inspectionId, step.imageIds[0]);
    }
  }

  return images;
}
