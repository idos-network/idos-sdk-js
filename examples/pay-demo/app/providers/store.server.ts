import { getDownloadUrl, put } from "@vercel/blob";
import { SERVER_ENV } from "~/providers/envFlags.server";
import type { TosDocumentLinks } from "./due.server";

const SERVER_URL = "https://tgu0ikcqdj22uiwr.public.blob.vercel-storage.com";

export interface UserItem {
  id: string;
  address: string;
  message: string;
  signature: string;
  lastSignedIn: string;
  idOSUserId: string;

  // Shared kyc (so we won't ask again)
  sharedKyc?: SharedKycItem;

  // Due
  due?: DueUserItem;

  // Transak
  transak?: TransakUserItem;
}

export interface SharedKycItem {
  id: string;
}

export interface TransakUserItem {
  id: string;
}

export interface DueUserItem {
  accountId: string;
  tosAccepted: boolean;
  // new - account created
  // kyc created via shared token
  // resubmission_required - KYC missing parts
  // pending - KYC is in progress
  // passed - KYC is passed
  // failed - KYC is failed
  kycStatus: "new" | "created" | "resubmission_required" | "pending" | "passed" | "failed";
  kycLink?: string;
  tosLinks?: TosDocumentLinks;
  tosToken?: string;
}

export async function getUserItem(address: string): Promise<UserItem | null> {
  const item = getDownloadUrl(`${SERVER_URL}/${SERVER_ENV.BLOB_PREFIX}/${address}.json`);
  const response = await fetch(item);

  console.log("response", response);

  if (!response.ok) return null;

  return JSON.parse(await response.text()) as UserItem;
}

export async function setUserItem(item: UserItem): Promise<string> {
  const response = await put(
    `${SERVER_ENV.BLOB_PREFIX}/${item.address}.json`,
    JSON.stringify(item),
    {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    },
  );

  return response.downloadUrl;
}

// Due mapping address to dueId
export async function setDueMap(userAddress: string, dueId: string): Promise<string> {
  const response = await put(`${SERVER_ENV.BLOB_PREFIX}/due/${dueId}.txt`, userAddress, {
    access: "public",
    contentType: "text/plain",
    allowOverwrite: true,
  });

  return response.downloadUrl;
}

export async function getUserByDueId(dueId: string): Promise<UserItem | null> {
  const item = getDownloadUrl(`${SERVER_URL}/${SERVER_ENV.BLOB_PREFIX}/due/${dueId}.txt`);
  const response = await fetch(item);

  if (!response.ok) return null;

  const userAddress = await response.text();
  return getUserItem(userAddress);
}
