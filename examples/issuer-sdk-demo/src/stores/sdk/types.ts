import type { idOS } from "@idos-network/idos-sdk";

export interface SdkState {
  sdk: idOS | null;
  setSdk: (sdk: idOS) => void;
}
