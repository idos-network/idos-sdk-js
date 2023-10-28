import { ethers } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import "@near-wallet-selector/modal-ui-js/styles.css";

import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import { idOS } from "@idos-network/idos-sdk";
import { Terminal } from "./terminal";

document.querySelector("#reset").addEventListener("click", async (e) => {
  await idos.reset();
  window.location.reload();
});

const connectWallet = {
  EVM: async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return await provider.getSigner();
  },

  NEAR: async () => {
    const selector = await setupWalletSelector({
      network: "testnet",
      modules: [setupHereWallet(), setupMeteorWallet(), setupMyNearWallet(), setupNightly()],
    });

    !selector.isSignedIn() && await new Promise((resolve) => {
      const { defaultContractId: contractId, contractMethods: methodNames } =
        idOS.near;
      const modal = setupModal(selector, { contractId, methodNames });

      // NOTE: `setTimeout` gives Meteor's extension a chance to breathe.
      // We observe that it triggers this callback before it's ready for a
      // second method call, which `setNearSigner` does immediately after
      // this promise resolves
      modal.on("onHide", () => setTimeout(resolve, 100));

      modal.show();
    });

    return selector.wallet();
  }
};


let chosenWallet = window.localStorage.getItem("chosen-wallet");
if (!chosenWallet) {
  await new Promise((resolve) => {
    const walletChooser = document.querySelector("#wallet-chooser");
    walletChooser.style.display = "block";
    walletChooser.addEventListener("submit", async (e) => {
      e.preventDefault();
      walletChooser.style.display = "none";

      chosenWallet = e.submitter.name;
      window.localStorage.setItem("chosen-wallet", chosenWallet);
      resolve();
    });
  });
}

/*
 * idOS: setup
 *
 */
const idos = await idOS.init({
  nodeUrl: "https://nodes.staging.idos.network",
  container: "#idos_container",
});

await idos.setSigner(chosenWallet, await connectWallet[chosenWallet]());

/*
 * idOS: queries
 *
 */
const terminal = new Terminal("#terminal", idos);

const { humanId, address, publicKey } = await idos.auth.currentUser();

if (!humanId) {
  terminal
    .status("fail", "No idOS profile found")
    .h1("next", "Need an idOS profile?")
    .log(`Get one at <a href="https://app.fractal.id">Fractal ID</a>`)
    .h1("next", "Already have one? Please connect the right signer")
    .log(`Currently connected signer`)
    .table({ address, publicKey });
} else {
  terminal
    .h1("rocket", "Connected to the idOS")
    .h2("Node URL")
    .log(idos.nodeUrl)
    .h2("Your idOS ID")
    .log(humanId);

  let wallets = idos.data.list("wallets");
  terminal.h1("eyes", "Your wallets");
  terminal.wait("awaiting signature", wallets);
  terminal.table(await wallets, ["address", "public_key"]);

  let credentials = idos.data.list("credentials");
  terminal.h1("eyes", "Your credentials");
  terminal.wait("awaiting signature", credentials);
  terminal.table(await credentials, ["issuer", "credential_type"]);

  let grants = idos.grants.list({ owner: address });
  terminal.h1("eyes", "Your grants");
  terminal.wait("awaiting RPC", grants);
  terminal.table(await grants, ["owner", "grantee", "data_id", "dataId", "lockedUntil"]);

  terminal.done();
}
