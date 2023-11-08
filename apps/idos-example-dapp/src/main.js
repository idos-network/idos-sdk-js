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
import { Cache } from "./cache";


/*
 * Initializing the idOS
 *
 */
const idos = await idOS.init({ container: "#idos-container" });


/*
 * Setting up the demo
 *
 */
const terminal = new Terminal("#terminal", idos);
const cache = new Cache();


/*
 * Example wallet connection options
 *
 */
let chosenWallet = window.localStorage.getItem("chosen-wallet");
let chosenFlow = JSON.parse(window.localStorage.getItem("chosen-flow")) || {};

if (!chosenWallet) {
  await new Promise((resolve) => {
    const walletChooser = document.querySelector("#wallet-chooser");
    walletChooser.style.display = "block";
    walletChooser.addEventListener("submit", async (e) => {
      e.preventDefault();
      walletChooser.style.display = "none";

      chosenWallet = e.submitter.name;
      window.localStorage.setItem("chosen-wallet", chosenWallet);

      [...e.target.querySelectorAll("input[type=checkbox]")]
        .forEach(({ name, checked }) => chosenFlow[name] = checked)
      window.localStorage.setItem("chosen-flow", JSON.stringify(chosenFlow));

      resolve();
    });
  });
}

const connectWallet = {
  EVM: async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  },

  NEAR: async () => {
    const {
      defaultContractId: contractId,
      contractMethods: methodNames,
      defaultNetwork: network,
    } = idOS.near;

    const selector = await setupWalletSelector({
      network,
      modules: [setupHereWallet(), setupMeteorWallet(), setupMyNearWallet(), setupNightly()],
    });

    !selector.isSignedIn() && await new Promise((resolve) => {
      const modal = setupModal(selector, { contractId, methodNames });

      // NOTE: `setTimeout` gives Meteor's extension a chance to breathe.
      // We observe that it triggers this callback before it's ready for a
      // second method call, which `setNearSigner` does immediately after
      // this promise resolves
      modal.on("onHide", () => setTimeout(resolve, 100));
      modal.show();
    });

    const wallet = await selector.wallet();
    wallet.address = (await wallet.getAccounts())[0].accountId;
    return wallet;
  }
};


/*
 * 🚀 idOS, here we go!
 *
 */
(async () => {
  /*
   * Connecting a wallet
   *
   */
  const signer = await terminal
    .h1("rocket", "idOS connection")
    .h2("Node URL")
    .log(idos.nodeUrl)
    .wait("awaiting wallet", connectWallet[chosenWallet]());

  if (!signer) return;


  /*
   * Are you in the idOS?
   *
   */
  const currentUser = await terminal.wait(
    "awaiting idOS setup (signatures and password)",
    idos.setSigner(chosenWallet, signer),
  );

  if (!currentUser) return;

  const { humanId, address, publicKey } = currentUser;

  if (!humanId) {
    terminal
      .h1("pleading", "No idOS profile found")
      .h2(`Need an idOS profile?`)
      .log(`Get one at <a href="${idOS.profileProviders[0]}">Fractal ID</a>`)
      .h2(`Already have one?`)
      .log(`Please connect the right signer`)
      .h1("eyes", `Currently connected signer:`)
      .table({ address, publicKey })
      .status("done", "Done");
    return;
  }

  terminal
    .h2("Your idOS ID")
    .log(humanId);


  /*
   * Optional consent screen
   *
   */
  if (chosenFlow.consent) {
    let consent = cache.get("consent");
    await new Promise(resolve => setTimeout(resolve, consent ? 0 : 250));
    consent = await terminal
      .h1("ask", "Consent request")
      .log("(optional) you can use our SDK as consent UI")
      .wait(
        "awaiting consent",
        consent || idos.enclave.confirm("Do we have your consent to read data from the idOS?"),
      );
    terminal.h2("Consent").log(consent);
    cache.set("consent", consent);

    if (!consent) return terminal.status("done", "No consent: stopped");
  }


  /*
   * Some idOS queries
   *
   * or just use the console:
   * console.log(await idos.data.list("wallets"));
   *
   */
  if (chosenFlow.wallets) {
    const wallets = cache.get("wallets") || idos.data.list("wallets");
    terminal.h1("eyes", "Your wallets").wait("awaiting signature", wallets);
    terminal.table(await wallets, ["address", "public_key"], {
      address: (address) => {
        if (address.match(/^0x[0-9A-Fa-f]{40}$/i)) {
          window.open(`https://zapper.xyz/account/${address}`);
        } else if (address.match(/^\w+\.(near|testnet)$/i)) {
          window.open(`https://explorer.${idOS.near.defaultNetwork}.near.org/accounts/${address}`);
        }
      }
    });
    cache.set("wallets", await wallets);
  }

  if (chosenFlow.credentials) {
    const credentials = cache.get("credentials") || idos.data.list("credentials");
    terminal.h1("eyes", "Your credentials").wait("awaiting signature", credentials);
    terminal.table(await credentials, ["issuer", "credential_type", "id"], {
      id: async (id) => {
        const credential = cache.get(`credential_${id}`) || idos.data.get("credentials", id);
        await terminal
          .detail()
          .h1("inspect", `Credential # ${id}`)
          .wait("awaiting signature", credential);
        cache.set(`credential_${id}`, await credential);
        await terminal
          .wait("verifying credential...", idOS.verifiableCredentials.verify((await credential).content))
          .then(_ => terminal.status("done", "Verified"))
          .catch(terminal.error.bind(terminal));
        terminal
          .h1("eyes", "Content")
          .json(JSON.parse((await credential).content));
      },
    });
    cache.set("credentials", await credentials);
  }

  if (chosenFlow.grants) {
    const grants = cache.get("grants") || idos.grants.list({ owner: address });
    terminal.h1("eyes", "Your grants").wait("awaiting RPC", grants);
    terminal.table(await grants, ["owner", "grantee", "dataId", "lockedUntil"]);
    cache.set("grants", await grants);
  }

  terminal.status("done", "Done");
})();
