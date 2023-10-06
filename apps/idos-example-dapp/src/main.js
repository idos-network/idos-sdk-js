import "@near-wallet-selector/modal-ui-js/styles.css";
import { ethers, ZeroAddress, Contract } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";

import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import * as nearAPI from "near-api-js";

import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.playground.idos.network", container: "#idOS" });
await idos.crypto.init();

const useEvmWallet = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  await idos.auth.setWalletSigner(signer);

  // NOTE if using access grants
  await idos.grants.init({ signer, type: "evm" });
};

const useNearWallet = async () => {
  let wallet, walletSelectorReady;

  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()],
  });

  const modal = setupModal(selector, {
    contractId: "idos-dev-1.near",
    methodNames: ["insert_grant", "find_grants"],
  });
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

  // NOTE if using access grants
  await idos.grants.init({
    account: signMessage.accountId,
    wallet: await selector.wallet(),
    type: "near",
  });
};

const useEnclaveSigner = async () => {
  await idos.auth.setEnclaveSigner();
};

let contract;


// NOTE this method can only be used for reading, because keyStore only has public keys
const findGrants = async ({ owner, grantee, dataId }) => (
  await contract.find_grants({owner, grantee, data_id: dataId})
);


/*
 * pick one
 */
//await useEvmWallet();
await useNearWallet();
//await useEnclaveSigner();


/*
 * finally
 */
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
