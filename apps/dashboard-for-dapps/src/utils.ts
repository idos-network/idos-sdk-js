import { base64Decode, base64Encode, utf8Decode } from "@idos-network/utils/codecs";
import ascii85 from "ascii85";
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

export function isKeyFile(key: string) {
  return key.endsWith("_file") || key.endsWith("File");
}

export function transformBase85Image(src: string) {
  const prefix = "data:image/jpeg;base85,";

  let data = src;

  if (data.startsWith(prefix)) {
    data = data.substring(prefix.length);
  }

  return `data:image/png;base64,${base64Encode(ascii85.decode(data))}`;
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
