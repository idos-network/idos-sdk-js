import "@near-wallet-selector/modal-ui-js/styles.css";
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
  const contractId = "idos-dev-1.testnet";
  let accountId, wallet, walletSelectorReady;

  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()],
  });

  const modal = setupModal(selector, {
    contractId,
    methodNames: idos.grants.near.contractMethods,
  });
  const subscription = modal.on("onHide", async () => {
    wallet = await selector.wallet();
    accountId = (await wallet.getAccounts())[0].accountId;
    walletSelectorReady();
  });
  modal.show();

  await new Promise((resolve) => (walletSelectorReady = resolve));

  // initial signMessage needed to get the public key
  // (because signIn will always return a different key)
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

  await idos.grants.init({ type: "near", accountId, wallet, contractId });
};

const useEnclaveSigner = async () => {
  await idos.auth.setEnclaveSigner();
};

/*
 * pick one
 */
// NOTE if using EVM
// await useEvmWallet();
// NOTE if using NEAR (for testing: before idOS nodes implement NEP-413)
await useNearWallet();
await useEnclaveSigner();
// NOTE if using NEAR (production: after idOS nodes implement NEP-413)
// await useNearWallet();

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
