import { idOS } from "@idos-network/idos-sdk";

export const idos = new idOS({
  url: import.meta.env.VITE_DB_PROVIDER,
  container: "#idos",
});
