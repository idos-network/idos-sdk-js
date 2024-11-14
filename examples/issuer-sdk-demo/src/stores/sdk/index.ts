import type { idOS } from "@idos-network/idos-sdk";
import { create } from "zustand";
import type { SdkState } from "./types";

export const useSdkStore = create<SdkState>()((set) => ({
  sdk: null,
  setSdk: (sdk: idOS) => set({ sdk }),
}));
