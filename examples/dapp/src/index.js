import { ethers } from "ethers";
import { idOS } from "@idos-network/idos-sdk";

const web3provider = new ethers.BrowserProvider(window.ethereum);
await web3provider.send("eth_requestAccounts", []);

const idos = new idOS({ url: "https://nodes.idos.network" });

await idos.auth.setWeb3Signer(await web3provider.getSigner());

const currentUser = await idos.auth.currentUser();
console.log(`idOS user: ${currentUser.humanId}`);

const userPublicKey = await idos.crypto.init();
console.log(`User's encryption public key: ${userPublicKey}`);

const encrypted = await idos.crypto.encrypt("some plaintext", userPublicKey);
const decrypted = await idos.crypto.decrypt(encrypted);
console.log(`Decrypted: ${decrypted}`);

const attributes = await idos.data.list("attributes");
console.log("attributes", attributes);

// await idos.data.create("attributes", { "attribute_key": "sdk", "value": prompt("attribute value") });
