import { ethers } from "ethers";
import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.idos.network", container: "#idOS" });

await idos.crypto.init();

//const web3provider = new ethers.BrowserProvider(window.ethereum);
//await web3provider.send("eth_requestAccounts", []);
//await idos.auth.setWalletSigner(await web3provider.getSigner());
await idos.auth.setEnclaveSigner();

const currentUser = await idos.auth.currentUser();

document.querySelector("button#create_attribute").style.display = "block";

document.querySelector("#display").innerHTML = `
  <strong>Connected to idOS</strong>
  <br>
  <code>Human ID: ${currentUser.humanId}</code>
`;

const attributes = await idos.data.list("attributes");

for (const attribute of attributes) {
  const li = document.createElement("li");

  attribute.value = await idos.crypto.decrypt(attribute.value) || attribute.value;

  li.innerText = `${attribute.attribute_key}: ${attribute.value}`;
  document.querySelector("#list_attributes").appendChild(li);
}

document.querySelector("#create_attribute").addEventListener("click", async (e) => {
  await idos.data.create("attributes", {
    "attribute_key": "example_dapp",
    "value": await idos.crypto.encrypt(prompt("attribute value"), idos.crypto.publicKeys.encryption.base64),
  });
});
