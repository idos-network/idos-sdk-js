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

const idos = await idOS.init({
  nodeUrl: "https://nodes.staging.idos.network",
  container: "#idos_container"
});

const connectWallet = {
  EVM: async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    await idos.auth.setEvmSigner(signer);
    await idos.crypto.init();
    await idos.grants.init({ signer, type: "evm" });
  },

  NEAR: async () => {
    const selector = await setupWalletSelector({
      network: "testnet",
      modules: [setupHereWallet(), setupMeteorWallet(), setupMyNearWallet(), setupNightly()],
    });

    !selector.isSignedIn() && await new Promise((resolve) => {
      const { defaultContractId: contractId, contractMethods: methodNames } =
        idos.grants.near;
      const modal = setupModal(selector, { contractId, methodNames });

      // NOTE: `setTimeout` gives Meteor's extension a chance to breathe.
      // We observe that it triggers this callback before it's ready for a
      // second method call, which `setNearSigner` does immediately after
      // this promise resolves
      modal.on("onHide", () => setTimeout(resolve, 100));

      modal.show();
    });

    const wallet = await selector.wallet();
    const accountId = (await wallet.getAccounts())[0].accountId;

    await idos.auth.setNearSigner(wallet);
    await idos.crypto.init();
    await idos.grants.init({ type: "near", accountId, wallet });
  }
};

document.querySelector("#reset").addEventListener("click", async (e) => {
  await idos.reset();
  window.location.reload();
});


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
try {
  await connectWallet[chosenWallet]();
} catch (e) {
  console.log(e);
}

/*
 * idOS: queries
 *
 */
const terminal = new Terminal("#terminal");
const { humanId, address, publicKey } = await idos.auth.currentUser();


if (!humanId) {
  terminal
    .status("fail", "No idOS profile found")
    .header("next", "Need an idOS profile?")
    .log(`Get one at <a href="https://app.fractal.id">Fractal ID</a>`)
    .header("next", "Already have one? Please connect the right signer")
    .log(`Currently connected signer`)
    .table({ address, publicKey });
} else {
  terminal
    .header("rocket", "Connected to the idOS")
    .table({"node URL": idos.nodeUrl})
    .table({"Your idOS ID": humanId});

  let wallets = idos.data.list("wallets");
  terminal.header("eyes", "Your wallets");
  terminal.wait("awaiting signature", wallets);
  terminal.table(await wallets, ["address", "public_key"]);

  let credentials = idos.data.list("credentials");
  terminal.header("eyes", "Your credentials");
  terminal.wait("awaiting signature", credentials);
  terminal.table(await credentials, ["issuer", "credential_type"]);

  let grants = idos.grants.list({ owner: address });
  terminal.header("eyes", "Your grants");
  terminal.wait("awaiting RPC", grants);
  // FIXME: near-rs expects data_id, near-ts expects dataId
  terminal.table(await grants, ["owner", "grantee", "data_id", "dataId", "lockedUntil"]);

  terminal.done();
}
