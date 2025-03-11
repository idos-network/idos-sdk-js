import {
  requestDAGSignature as _requestDAGSignature,
  type idOSDAGSignatureParams,
} from "@idos-network/core";
import type { ConsumerConfig } from "./create-consumer-config";

/**
 * Request a signature for a Delegated Access Grant
 */
export async function requestDAGSignature(
  { kwilClient }: ConsumerConfig,
  params: idOSDAGSignatureParams,
) {
  return _requestDAGSignature(kwilClient, params);
}
