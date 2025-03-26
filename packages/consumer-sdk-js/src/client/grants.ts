import {
  requestDAGMessage as _requestDAGMessage,
  type idOSDAGSignatureParams,
} from "@idos-network/core/kwil-actions";
import type { ConsumerClientConfig } from "./create-consumer-client-config";

/**
 * Request a signature for a Delegated Access Grant
 */
export async function requestDAGMessage(
  { kwilClient }: ConsumerClientConfig,
  params: idOSDAGSignatureParams,
) {
  return _requestDAGMessage(kwilClient, params);
}
