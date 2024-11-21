"use client";

import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import * as StableBase64 from "@stablelib/base64";
import type { Current } from "../api";

export const idosPublicKey = async ({
  current,
  container = "#idos-container",
  reset = true,
}: {
  current?: Current | null;
  usePasskeys?: boolean;
  container?: string;
  reset?: boolean;
}) => {
  const idosInstance: idOSSDK = await idOSSDK.init({
    nodeUrl: "https://nodes.idos.network",
    enclaveOptions: {
      container,
      mode: "new",
      url: "https://enclave.idos.network",
    },
  });

  if (reset) {
    await idosInstance.enclave.provider.reset();
  }

  const encPublicKey: Uint8Array = await idosInstance.enclave.provider.ready(
    current?.user?.idosHumanId ?? current?.user?.id,
  );

  return StableBase64.encode(encPublicKey);
};
