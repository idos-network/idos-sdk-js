import * as Base64Codec from "@stablelib/base64";
import ascii85 from "ascii85";

export function openImageInNewTab(base64Image: string) {
  const newWindow = window.open();

  if (newWindow) {
    newWindow.document.write(`
        <html>
          <head>
            <title>Document Image</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #000;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${base64Image}" alt="Document Image">
          </body>
        </html>
      `);
    newWindow.document.close();
  }
}

export function transformBase85Image(src: string) {
  const prefix = "data:image/jpeg;base85,";

  return `data:image/png;base64,${Base64Codec.encode(
    ascii85.decode(src.substring(prefix.length)),
  )}`;
}
