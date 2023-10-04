import { ethers } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";

import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.playground.idos.network", container: "#idOS" });
await idos.crypto.init();

const useEvmWallet = async () => {
  const web3provider = new ethers.BrowserProvider(window.ethereum);
  await web3provider.send("eth_requestAccounts", []);
  await idos.auth.setWalletSigner(await web3provider.getSigner());
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

  await new Promise(resolve => walletSelectorReady = resolve);

  // initial signMessage needed to get the public key
  const message = "idOS authentication";
  const recipient = "idos.network";
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
  const signMessage = await wallet.signMessage({ message, recipient, nonce });

  const signer = async (message) => {
    message = new TextDecoder().decode(message);
    const signMessage = await wallet.signMessage({ message, recipient, nonce });
    const signature = Uint8Array.from(atob(signMessage.signature), c => c.charCodeAt(0));
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
//await useEvmWallet();
//await useNearWallet();
await useEnclaveSigner();


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
      "attribute_key": "example_dapp",
      "value": prompt("attribute value"),
    });
  });
}
