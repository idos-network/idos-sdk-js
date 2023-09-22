import { ethers } from "ethers";
import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.idos.network", container: "#idOS" });

await idos.crypto.init();

//const web3provider = new ethers.BrowserProvider(window.ethereum);
//await web3provider.send("eth_requestAccounts", []);
//await idos.auth.setWalletSigner(await web3provider.getSigner());
await idos.auth.setEnclaveSigner();

const currentUser = await idos.auth.currentUser();

document.querySelector("#display").innerHTML = `
  <strong>Connected to idOS</strong>
  <br>
  <code>Human ID: ${currentUser.humanId}</code>
`;

const message = "some plaintext";
const encrypted = await idos.crypto.encrypt(message, idos.crypto.publicKeys.encryption.base64);
const decrypted = await idos.crypto.decrypt(encrypted);
console.log(`Decrypted: ${decrypted}`);

const attributes = await idos.data.list("attributes");
console.log("attributes", attributes);

//await idos.data.create("attributes", { "attribute_key": "sdk", "value": prompt("attribute value") });
