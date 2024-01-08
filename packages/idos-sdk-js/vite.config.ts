import path from "path";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "idOS",
      fileName: "idos-sdk"
    }
  },
  plugins: [
    dts({
      rollupTypes: true
    }),
    externalizeDeps({
      deps: true,
      devDeps: false,
      except: [],
      nodeBuiltins: true,
      optionalDeps: true,
      peerDeps: true
    })
  ],
  test: {
    globals: true,
    environment: "jsdom"
  }
});
