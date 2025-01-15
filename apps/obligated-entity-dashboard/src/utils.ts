import { base64Decode, utf8Decode } from "@idos-network/codecs";
import nacl from "tweetnacl";

export function decrypt(b64FullMessage: string, b64SenderPublicKey: string, secretKey: string) {
  const fullMessage = base64Decode(b64FullMessage);
  const senderPublicKey = base64Decode(b64SenderPublicKey);

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, base64Decode(secretKey));

  if (decrypted == null) {
    return "";
  }

  return utf8Decode(decrypted);
}

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

export function changeCase(str: string) {
  return str.replace(/_/g, " ");
}
