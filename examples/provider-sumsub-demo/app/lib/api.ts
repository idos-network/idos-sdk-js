interface AppParams {
  client: string;
  level: string;
  redirectUri: string;
  publicEncryptionKey?: string;
  grantee?: string;
}

export async function init(body: AppParams): Promise<string | null> {
  const response = await fetch("/api/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.json().then((data) => data.error);
}

export interface User {
  id?: string;
  address: string;
  sumSubStatus?: "none" | "initialized" | "approved" | "rejected";
  loginMessage?: string | null;
  loginSignature?: string | null;
  idosPubKey?: string | null;
  idosGrantMessage?: string | null;
  idosGrantSignature?: string | null;
  idosGrantTransactionId?: string | null;
  idosHumanId?: string | null;
  idosWalletId?: string | null;
  idosCredentialId?: string | null;
}

export interface Current {
  application?: AppParams;
  loggedIn: boolean;
  user?: User;
  error?: string;
}

export async function fetchCurrent() {
  const response = await fetch("/api/current", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  });

  return response.json() as Promise<Current>;
}

export async function fetchSumSubToken() {
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  });

  return response.json().then((res) => res.token) as Promise<string>;
}

export interface UpdateIdos {
  idosPubKey?: string;
  idosGrantMessage?: string;
  idosGrantSignature?: string;
  idosGrantOwner?: string;
  idosGrantGrantee?: string;
  idosGrantDataId?: string;
  idosGrantLockedUntil?: bigint;
}

export async function updateIdosData(data: UpdateIdos) {
  const response = await fetch("/api/idos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}
