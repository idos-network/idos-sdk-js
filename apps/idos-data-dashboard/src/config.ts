import { createConfig } from "@idos-network/idos-sdk";

const config = createConfig({
  enclave: {
    options: {
      iframe: { container: "#idos" },
    },
  },
});

export default config;