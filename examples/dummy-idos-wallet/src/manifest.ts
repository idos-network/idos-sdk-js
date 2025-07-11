// eslint-disable-next-line import/no-extraneous-dependencies
import { defineManifest } from "@crxjs/vite-plugin";

import packageData from "../package.json";

const isDev = process.env.NODE_ENV === "development";

export default defineManifest({
  manifest_version: 3,
  name: `${packageData.displayName || packageData.name}${isDev ? " ➡️ Dev" : ""}`,
  version: packageData.version,
  description: packageData.description,
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      16: "icon16.png",
      32: "icon32.png",
      48: "icon48.png",
      128: "icon128.png",
    },
  },
  icons: {
    16: "icon16.png",
    32: "icon32.png",
    48: "icon48.png",
    128: "icon128.png",
  },
  permissions: ["activeTab", "storage"],
  content_scripts: [
    {
      js: ["src/content.js"],
      matches: ["<all_urls>"],
    },
    {
      js: ["src/injected-script.ts"],
      matches: ["<all_urls>"],
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/injected-script.ts", "*.js", "*.css", "public/*"],
      matches: ["<all_urls>"],
    },
  ],
});
