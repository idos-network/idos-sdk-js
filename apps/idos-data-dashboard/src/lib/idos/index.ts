import { idOS as idOSSDK } from "@idos-network/idos-sdk";

export const idOS = await idOSSDK.init({
  nodeUrl: import.meta.env.VITE_NODE_URL,
  container: "#idOS"
});
