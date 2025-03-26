import { getUserProfile as _getUserProfile, hasProfile } from "@idos-network/core/kwil-actions";
import type { ConsumerClientConfig } from "./create-consumer-client-config";

/**
 * Check if a user has a profile in the idOS by the given `address`
 */
export async function checkUserProfile({ kwilClient }: ConsumerClientConfig, address: string) {
  return hasProfile(kwilClient, address);
}

/**
 * Get the profile of the current user.
 */
export async function getUserProfile({ kwilClient }: ConsumerClientConfig) {
  return _getUserProfile(kwilClient);
}
