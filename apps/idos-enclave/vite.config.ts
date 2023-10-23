import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  server: {
    https: true
  },
  plugins: [
    createHtmlPlugin({
      pages: [
        {
          entry: "src/main.js",
          filename: "index.html",
          template: "index.html",
          injectOptions: {
            data: {
              title: "index",
              injectScript: `<script src="./inject.js"></script>`
            },
            tags: [
              {
                injectTo: "body-prepend",
                tag: "div",
                attrs: {
                  id: "tag1"
                }
              }
            ]
          }
        },
        {
          entry: "src/dialog.js",
          filename: "dialog.html",
          template: "dialog.html",
          injectOptions: {
            data: {
              title: "index",
              injectScript: `<script src="./inject.js"></script>`
            },
            tags: [
              {
                injectTo: "body-prepend",
                tag: "div",
                attrs: {
                  id: "tag1"
                }
              }
            ]
          }
        }
      ]
    }),
    mkcert()
  ]
});
