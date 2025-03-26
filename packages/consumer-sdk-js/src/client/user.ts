import { getUserProfile as _getUserProfile, hasProfile } from "@idos-network/core/kwil-actions";
import type { ConsumerConfig } from "./create-consumer-config";

/**
 * Check if a user has a profile in the idOS by the given `address`
 */
export async function checkUserProfile({ kwilClient }: ConsumerConfig, address: string) {
  return hasProfile(kwilClient, address);
}

/**
 * Get the profile of the current user.
 */
export async function getUserProfile({ kwilClient }: ConsumerConfig) {
  return _getUserProfile(kwilClient);
}
