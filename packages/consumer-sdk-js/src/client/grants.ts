import {
  requestDAGMessage as _requestDAGMessage,
  type idOSDAGSignatureParams,
} from "@idos-network/core";
import type { ConsumerConfig } from "./create-consumer-config";

/**
 * Request a signature for a Delegated Access Grant
 */
export async function requestDAGMessage(
  { kwilClient }: ConsumerConfig,
  params: idOSDAGSignatureParams,
) {
  return _requestDAGMessage(kwilClient, params);
}
