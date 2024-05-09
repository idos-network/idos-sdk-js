// vite.config.ts
import path from "path";
import dts from "file:///Users/fernando/dev/fractal/idos-sdk-js/node_modules/.pnpm/vite-plugin-dts@3.6.3_typescript@5.2.2_vite@4.5.0/node_modules/vite-plugin-dts/dist/index.mjs";
import { externalizeDeps } from "file:///Users/fernando/dev/fractal/idos-sdk-js/node_modules/.pnpm/vite-plugin-externalize-deps@0.8.0_vite@4.5.0/node_modules/vite-plugin-externalize-deps/dist/index.js";
import { defineConfig } from "file:///Users/fernando/dev/fractal/idos-sdk-js/node_modules/.pnpm/vitest@0.31.4_@vitest+ui@0.34.6_jsdom@22.1.0/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "/Users/fernando/dev/fractal/idos-sdk-js/packages/idos-sdk-js";
var vite_config_default = defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: path.resolve(__vite_injected_original_dirname, "src/lib/index.ts"),
      name: "idOS",
      fileName: "idos-sdk",
      formats: ["es"]
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZmVybmFuZG8vZGV2L2ZyYWN0YWwvaWRvcy1zZGstanMvcGFja2FnZXMvaWRvcy1zZGstanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9mZXJuYW5kby9kZXYvZnJhY3RhbC9pZG9zLXNkay1qcy9wYWNrYWdlcy9pZG9zLXNkay1qcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZmVybmFuZG8vZGV2L2ZyYWN0YWwvaWRvcy1zZGstanMvcGFja2FnZXMvaWRvcy1zZGstanMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5pbXBvcnQgeyBleHRlcm5hbGl6ZURlcHMgfSBmcm9tIFwidml0ZS1wbHVnaW4tZXh0ZXJuYWxpemUtZGVwc1wiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvbGliL2luZGV4LnRzXCIpLFxuICAgICAgbmFtZTogXCJpZE9TXCIsXG4gICAgICBmaWxlTmFtZTogXCJpZG9zLXNka1wiLFxuICAgICAgZm9ybWF0czogW1wiZXNcIl0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICByb2xsdXBUeXBlczogdHJ1ZSxcbiAgICB9KSxcbiAgICBleHRlcm5hbGl6ZURlcHMoe1xuICAgICAgZGVwczogdHJ1ZSxcbiAgICAgIGRldkRlcHM6IGZhbHNlLFxuICAgICAgZXhjZXB0OiBbXSxcbiAgICAgIG5vZGVCdWlsdGluczogdHJ1ZSxcbiAgICAgIG9wdGlvbmFsRGVwczogdHJ1ZSxcbiAgICAgIHBlZXJEZXBzOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNXLE9BQU8sVUFBVTtBQUN2WCxPQUFPLFNBQVM7QUFDaEIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxvQkFBb0I7QUFIN0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsS0FBSztBQUFBLE1BQ0gsT0FBTyxLQUFLLFFBQVEsa0NBQVcsa0JBQWtCO0FBQUEsTUFDakQsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxNQUNGLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFBQSxJQUNELGdCQUFnQjtBQUFBLE1BQ2QsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsUUFBUSxDQUFDO0FBQUEsTUFDVCxjQUFjO0FBQUEsTUFDZCxjQUFjO0FBQUEsTUFDZCxVQUFVO0FBQUEsSUFDWixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLEVBQ2Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
