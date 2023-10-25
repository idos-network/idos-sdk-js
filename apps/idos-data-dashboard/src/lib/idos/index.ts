import { idOS } from "@idos-network/idos-sdk";

export const idos = await idOS.init({
  nodeUrl: import.meta.env.VITE_NODE_URL,
  container: "#idos"
});
