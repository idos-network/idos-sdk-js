import { ethers } from "ethers";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import "@near-wallet-selector/modal-ui-js/styles.css";

import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

import { idOS } from "@idos-network/idos-sdk";

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

const idosQueries = async () => {
  const elem = document.querySelector("code#display");

  const display = (html, nest) =>
    ((nest ? elem.lastChild : elem).innerHTML += html);

  const { humanId, address } = await idos.auth.currentUser();

  elem.parentElement.style.display = "block";
  if (!humanId) {
    display(`
      <em>No idOS profile</em><br>
      <br>
      Get one here: <a href="#">Fractal ID</a>
    `);
  } else {
    display(`
      <em class="rocket"><strong>Connected to the idOS</strong></em><br>
      <br>
      <em class="header eyes"><strong>Your ID</strong></em><br>
      <span>${humanId}</span><br><br>
    `);
  }

  let wallets;
  await new Promise(async (resolve) => {
    elem.innerHTML += `<span class="wait">awaiting signature</span>`;
    wallets = await idos.data.list("wallets");
    elem.lastChild.remove();
    resolve();
  });

  display(`
    <em class="header eyes"><strong>Your wallets</strong></em><br>
    <div class="table">
      <div>
        <div><em><u>Address</u></em></div>
        <div><em><u>Public key</u></em></div>
      </div>
  `);

  for (const { address, public_key } of wallets) {
    display(
      `
      <div>
        <div>${address}</div>
        <div>${public_key}</div>
      </div>
    `,
      true
    );
  }
  display(`</div><br>`);

  let grants;
  await new Promise(async (resolve) => {
    elem.innerHTML += `<span class="wait">awaiting RPC</span>`;
    grants = await idos.grants.list({ owner: address });
    elem.lastChild.remove();
    resolve();
  });

  display(`
    <em class="header eyes"><strong>Your grants</strong></em><br>
    <div class="table">
      <div>
        <div><em><u>Owner</u></em></div>
        <div><em><u>Grantee</u></em></div>
        <div><em><u>Data ID</u></em></div>
        <div><em><u>Locked until</u></em></div>
      </div>
  `);

  // FIXME: near-rs expects data_id, near-ts expects dataId
  for (const { owner, grantee, dataId, data_id, lockedUntil } of grants) {
    display(
      `
      <div>
        <div>${owner}</div>
        <div>${grantee}</div>
        <div>${dataId || data_id}</div>
        <div>${lockedUntil}</div>
      </div>
    `,
      true
    );
  }
  display(`</div><br><br>`);
  display(`<em class="header tick"><strong>Complete</strong></em><br>`);
};

document
  .querySelector("#wallet-chooser")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    e.target.style.display = "none";

    await connectWallet[e.submitter.name]();

    /*
     * idOS queries
     *
     * get the user's idOS ID:
     *   await idos.auth.currentUser();
     *
     * get the user's wallets:
     *   await idos.data.list("wallets");
     *
     */
    idosQueries();
  });

document.querySelector("#reset").addEventListener("click", async (e) => {
  await idos.reset();
  window.location.reload();
});

// Automatically continue with NEAR when Back from MNW
if (window.location.href.match(/(accountId|account_id)=(.*?)&/)) {
  await connectWallet["NEAR"]();
  await idosQueries();
}
