import { neon } from "@neondatabase/serverless";
import { SERVER_ENV } from "~/providers/envFlags.server";
import type { TosDocumentLinks } from "./due.server";

const sql = neon(SERVER_ENV.DATABASE_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      address TEXT PRIMARY KEY,
      due_id TEXT,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export interface UserItem {
  id: string;
  address: string;
  message: string;
  signature: string;
  lastSignedIn: string;

  // idOS this has been set during the login
  idOSUserId?: string;

  // Shared kyc (so we won't ask again)
  sharedKyc?: SharedKycItem;

  // Due
  due?: DueUserItem;

  // Transak
  transak?: TransakUserItem;
}

export interface SharedKycItem {
  originalId: string;
  sharedId: string;
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
  await ensureTable();

  const rows = await sql`
    SELECT data FROM users WHERE address = ${address} LIMIT 1
  `;

  if (rows.length === 0) return null;

  return rows[0].data as UserItem;
}

export async function setUserItem(item: UserItem): Promise<void> {
  await ensureTable();

  const dueId = item.due?.accountId ?? null;

  await sql`
    INSERT INTO users (address, due_id, data, updated_at)
    VALUES (${item.address}, ${dueId}, ${JSON.stringify(item)}, NOW())
    ON CONFLICT (address)
    DO UPDATE SET due_id = ${dueId}, data = ${JSON.stringify(item)}, updated_at = NOW()
  `;
}

export async function getUserByDueId(dueId: string): Promise<UserItem | null> {
  await ensureTable();

  const rows = await sql`
    SELECT data FROM users WHERE due_id = ${dueId} LIMIT 1
  `;

  if (rows.length === 0) return null;

  return rows[0].data as UserItem;
}
