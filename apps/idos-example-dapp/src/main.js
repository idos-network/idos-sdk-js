import "@near-wallet-selector/modal-ui-js/styles.css";
import { ethers, ZeroAddress, Contract } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";

import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import * as borsh from "borsh";

import { idOS } from "@idos-network/idos-sdk";

const idos = new idOS({ url: "https://nodes.staging.idos.network", container: "#idOS" });

const useEvmWallet = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  // NOTE setting up for querying the idOS
  await idos.auth.setEvmSigner(signer);
  await idos.crypto.init();

  // NOTE setting up for querying the idOS
  await idos.grants.init({ signer, type: "evm" });
};

const useNearWallet = async () => {
  const contractId = idos.grants.near.defaultContractId;

  // NOTE standard wallet-selector initialization with modal
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

  // NOTE setting up for querying the idOS
  await idos.auth.setNearSigner(wallet);
  await idos.crypto.init();

  // NOTE setting up for using access grants
  await idos.grants.init({ type: "near", accountId, wallet });
};

/*
 * NOTE pick one
 */
// if using EVM
// await useEvmWallet();
//
// if using NEAR
await useNearWallet();
//
// if testing locally (not safe!)
// await idos.crypto.init();
// await idos.auth.setEnclaveSigner();

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
