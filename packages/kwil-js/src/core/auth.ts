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
  // @Yaiba: Should I trust the URI provided by KGW or should I use the domain / create my own?
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
  if (authParm.domain && authParm.domain !== domain) {
    throw new Error(`Domain mismatch: ${authParm.domain} !== ${domain}`);
  }
  if (authParm.version && authParm.version !== version) {
    throw new Error(`Version mismatch: ${authParm.version} !== ${version}`);
  }
  if (authParm.chain_id && authParm.chain_id !== chainId) {
    throw new Error(`Chain ID mismatch: ${authParm.chain_id} !== ${chainId}`);
  }
}
