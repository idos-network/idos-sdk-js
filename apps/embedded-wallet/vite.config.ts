import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		tailwindcss(),
		mkcert(),
		nodePolyfills({
			globals: {
				Buffer: true,
			},
		}),
	],
	build: {
		target: "esnext",
	},
});
