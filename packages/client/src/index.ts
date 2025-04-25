import { type EnclaveOptions, idOSClientConfiguration } from "@idos-network/core";

export type { idOSClient } from "@idos-network/core";

export * from "@idos-network/core/types";

export function createIDOSClient(config: {
  chainId?: string;
  nodeUrl: string;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
}) {
  return new idOSClientConfiguration(config);
}
