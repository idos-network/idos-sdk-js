import { ethers, ZeroAddress, Contract } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";

import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.playground.idos.network", container: "#idOS" });
await idos.crypto.init();

const useEvmWallet = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  await idos.auth.setWalletSigner(signer);
  await idos.grants.init({ signer, type: "evm" });
};

const useNearWallet = async () => {
  let wallet, walletSelectorReady;

  const selector = await setupWalletSelector({
    network: "mainnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()],
  });

  // custom selector
  document.querySelector("#near_wallet_selector").style.display = "block";
  document.querySelector("#near_wallet_selector form").addEventListener("submit", async (e) => {
    e.preventDefault();
    wallet = await selector.wallet(e.submitter.name);
    document.querySelector("#near_wallet_selector").style.display = "none";
    walletSelectorReady();
  });

  // We can't use this modal just for wallet selection, because
  // it will trigger wallet.signIn, which we don't need.
  // Cons: more signatures for the user
  // Pros: it's pretty and familiar
  const modal = setupModal(selector, { contractId: "idos-dev-1.near" });
  const subscription = modal.on("onHide", async () => {
    wallet = await selector.wallet();
    walletSelectorReady();
  });
  modal.show();

  await new Promise((resolve) => (walletSelectorReady = resolve));

  // initial signMessage needed to get the public key
  const message = "idOS authentication";
  const recipient = "idos.network";
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
  const signMessage = await wallet.signMessage({ message, recipient, nonce });

  const signer = async (message) => {
    message = new TextDecoder().decode(message);
    const signMessage = await wallet.signMessage({ message, recipient, nonce });
    const signature = Uint8Array.from(atob(signMessage.signature), (c) => c.charCodeAt(0));
    return { signature };
  };
  idos.auth.setWalletSigner(signer, signMessage.publicKey, "ed25519_nr");
};

const useEnclaveSigner = async () => {
  await idos.auth.setEnclaveSigner();
};

/*
 * pick one
 */
await useEvmWallet();
// await useNearWallet();
// await useEnclaveSigner();

/*
const currentUser = await idos.auth.currentUser();

if (!currentUser?.humanId) {
  document.querySelector("#display").innerHTML = `
    <strong>No idOS profile</strong>
    <br>
    Get one here: <a href="#">Fractal ID</a>
  `;
} else {
  document.querySelector("#display").innerHTML = `
    <strong>Connected to idOS</strong>
    <br>
    <code>Human ID: ${currentUser.humanId}</code>
  `;
  document.querySelector("button#create_attribute").style.display = "block";

  const attributes = await idos.data.list("attributes");

  for (const attribute of attributes) {
    const li = document.createElement("li");
    li.innerText = `${attribute.attribute_key}: ${attribute.value}`;
    document.querySelector("#list_attributes").appendChild(li);
  }

  document.querySelector("#create_attribute").addEventListener("click", async (e) => {
    await idos.data.create("attributes", {
      attribute_key: "example_dapp",
      value: prompt("attribute value"),
    });
  });
}
*/


/*
console.log(await idos.grants.create({
  grantee: "0x220DB51B3444B0B5CF27319cA2E9486C5E896477",
  id: "121",
  wait: false,
}));
*/

/*
console.log(await idos.grants.list({
  grantee: "0x220DB51B3444B0B5CF27319cA2E9486C5E896477",
  id: "120",
}));
*/

console.log(await idos.grants.revoke({
  grantee: "0x220DB51B3444B0B5CF27319cA2E9486C5E896477",
  id: "121",
  wait: false,
}));


/*
console.log(await idos.grants.list({
  grantee: "0x220DB51B3444B0B5CF27319cA2E9486C5E896477",
  id: "121",
}));
*/
