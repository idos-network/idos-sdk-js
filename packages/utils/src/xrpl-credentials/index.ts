/**
 * XRPL Credentials Module
 *
 * This module provides utilities for creating and managing XRPL credential transactions.
 * It includes functionality for:
 * - Creating credentials on the XRPL blockchain
 * - Generating credential acceptance payloads
 * - Managing both original and copy credentials
 */

// Export credential acceptance payload types and functions
export type { CredentialAcceptPayload } from "./accept";
export {
  CopyCredentialAcceptPayload,
  OriginalCredentialAcceptPayload,
} from "./accept";
// Export the main credential creation service
export { XrplCredentialsCreate } from "./create";
