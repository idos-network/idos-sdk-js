import { HexString } from "../utils/types";
import { BytesEncodingStatus, EnvironmentType } from "./enums";
import { Signature } from "./signature";

export interface AuthenticatedBody<
  T extends BytesEncodingStatus.HEX_ENCODED | BytesEncodingStatus.UINT8_ENCODED,
> {
  nonce: string;
  sender: HexString;
  signature: Signature<
    T extends BytesEncodingStatus.HEX_ENCODED
      ? BytesEncodingStatus.BASE64_ENCODED
      : BytesEncodingStatus.UINT8_ENCODED
  >;
}

export interface KGWAuthInfo {
  nonce: string;
  statement: string;
  issue_at: string;
  expiration_time: string;
  chain_id: string;
  domain: string;
  version: string;
  uri: string;
  /** Browser Origin stamped by KGW. Omitted for CLI/Node (no Origin header). */
  origin?: string;
}

export type AuthSuccess<T extends EnvironmentType> = T extends EnvironmentType.BROWSER
  ? BrowserAuthSuccess
  : NodeAuthSuccess;

export interface BrowserAuthSuccess {
  result: string;
}

export interface NodeAuthSuccess {
  result: string;
  cookie?: string;
}

export type LogoutResponse<T extends EnvironmentType> = T extends EnvironmentType.BROWSER
  ? LogoutResponseWeb
  : LogoutResponseNode;

interface LogoutResponseWeb {
  result: string;
}

interface LogoutResponseNode {
  result: string;
  cookie?: string;
}

export function composeAuthMsg(
  authParam: KGWAuthInfo,
  domain: string,
  version: string,
  chainId: string,
): string {
  let msg = "";
  msg += `${domain} wants you to sign in with your account:\n`;
  msg += `\n`;
  if (authParam.statement !== "") {
    msg += `${authParam.statement}\n`;
  }
  msg += "\n";
  msg += `URI: ${authParam.uri}\n`;
  if (authParam.origin) {
    msg += `Origin: ${authParam.origin}\n`;
  }
  msg += `Version: ${version}\n`;
  msg += `Chain ID: ${chainId}\n`;
  msg += `Nonce: ${authParam.nonce}\n`;
  msg += `Issue At: ${authParam.issue_at}\n`;
  msg += `Expiration Time: ${authParam.expiration_time}\n`;
  return msg;
}

export function generateSignatureText(
  namespace: string,
  action: string,
  digest: HexString,
  challenge: string,
): string {
  let sigText = "Kwil view call.\n";
  sigText += "\n";
  sigText += `Namespace: ${namespace}\n`;
  sigText += `Method: ${action}\n`;
  sigText += `Digest: ${digest}\n`;
  sigText += `Challenge: ${challenge}\n`;
  return sigText;
}

export function removeTrailingSlash(url: string): string {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
}

export function verifyAuthProperties(
  authParm: KGWAuthInfo,
  domain: string,
  version: string,
  chainId: string,
): void {
  if (authParm.domain !== domain) {
    throw new Error(`Domain mismatch: ${authParm.domain} !== ${domain}`);
  }
  if (authParm.version !== version) {
    throw new Error(`Version mismatch: ${authParm.version} !== ${version}`);
  }
  if (authParm.chain_id !== chainId) {
    throw new Error(`Chain ID mismatch: ${authParm.chain_id} !== ${chainId}`);
  }

  const uri = `${domain}/rpc/v1`;
  if (authParm.uri !== uri) {
    throw new Error(`URI mismatch: ${authParm.uri} !== ${uri}`);
  }

  verifyOrigin(authParm.origin);
}

function verifyOrigin(origin: string | undefined): void {
  const page = browserWindow();
  if (page === undefined) {
    if (origin !== undefined && origin !== "") {
      throw new Error(`Origin mismatch: ${origin}`);
    }
    return;
  }

  const expected = canonicalOrigin(page.location.origin);
  if (typeof origin !== "string" || origin === "" || canonicalOrigin(origin) !== expected) {
    throw new Error(`Origin mismatch: ${origin ?? ""} !== ${expected}`);
  }
}

// `window` is a DOM global. Integration typecheck is Node-only, so read it off globalThis.
function browserWindow(): { location: { origin: string } } | undefined {
  return (globalThis as { window?: { location: { origin: string } } }).window;
}

// KGW stamps scheme://host, both lowercased, with no user, path, query, or fragment.
function canonicalOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Origin mismatch: ${value}`);
  }
}
