import { idOSClientConfiguration } from "@idos-network/core";

export type { idOSClient } from "@idos-network/core";

export * from "@idos-network/core/types";

export function createIOSClient(config: idOSClientConfiguration) {
  return new idOSClientConfiguration(config);
}
