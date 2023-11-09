import { ethers } from "ethers";
import * as Base64Codec from "@stablelib/base64"

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

import * as nearAPI from "near-api-js";
window.nearAPI = nearAPI;

/*
 * Initializing the idOS
 *
 */
const idos = await idOS.init({ container: "#idos-container" });
window.idos = idos;
// {humanId: '134e7678-b2b2-4f4e-bf9f-ec9b75804c1d', address: '8371e11cabf6552ac19f383a3d689d846d543c97e999c1f4f9bcf9ac086d2d39', publicKey: 'ed25519:9r78Bid58xWmJZ1suyVZb1qLus8JNt1oXxuQUwcy9cat'} 5erx4hp8F9zbta+Pl526R9Y5oVGIIQni6AvjLFFkKxQ=
// {humanId: '8c92df31-6ae3-46e9-a1a9-50d10f74d99a', address: 'a80319daaca7a9d6c2570efa3f1e39ed3ff742d3deab41b281dc31ce0f914596', publicKey: 'ed25519:CJrEg6AzBvnfKxkywawdVKN1cTRsXKZpjet8McUkjBdf'} ClQjD0H2v4VKZhi/hlPb0df/jwlsA7A5UvypOGo+pUA=
/*
kwil-cli-0.2-alpha--0.5.0-SNAPSHOT-ea6d961e database execute --action add_human_as_owner --dbid `kwil-idos-dbid` '$id:134e7678-b2b2-4f4e-bf9f-ec9b75804c1d'
sleep 3
kwil-cli-0.2-alpha--0.5.0-SNAPSHOT-ea6d961e database execute --action upsert_wallet_as_owner --dbid `kwil-idos-dbid` '$id:'`uuidgen` '$human_id:134e7678-b2b2-4f4e-bf9f-ec9b75804c1d' '$address:8371e11cabf6552ac19f383a3d689d846d543c97e999c1f4f9bcf9ac086d2d39' '$public_key:g3HhHKv2VSrBnzg6PWidhG1UPJfpmcH0+bz5rAhtLTk=' '$message:message' '$signature:signature'
sleep 3
kwil-cli-0.2-alpha--0.5.0-SNAPSHOT-ea6d961e database execute --action add_human_as_owner --dbid `kwil-idos-dbid` '$id:8c92df31-6ae3-46e9-a1a9-50d10f74d99a'
sleep 3
kwil-cli-0.2-alpha--0.5.0-SNAPSHOT-ea6d961e database execute --action upsert_wallet_as_owner --dbid `kwil-idos-dbid` '$id:'`uuidgen` '$human_id:8c92df31-6ae3-46e9-a1a9-50d10f74d99a' '$address:a80319daaca7a9d6c2570efa3f1e39ed3ff742d3deab41b281dc31ce0f914596' '$public_key:qAMZ2qynqdbCVw76Px457T/3QtPeq0Gygdwxzg+RRZY=' '$message:message' '$signature:signature'
sleep 3
kwil-cli-0.2-alpha--0.5.0-SNAPSHOT-ea6d961e database execute --action upsert_wallet_as_owner --dbid `kwil-idos-dbid` '$id:'`uuidgen` '$human_id:8c92df31-6ae3-46e9-a1a9-50d10f74d99a' '$address:pkoch.testnet' '$public_key:bxPqlYkJ3YujvWeUG1qWnbDOZe6y8Tfc3t1GGexCcg4=' '$message:message' '$signature:signature'

*/
/* Using a80319daaca7a9d6c2570efa3f1e39ed3ff742d3deab41b281dc31ce0f914596:
record = await idos.data.create("credentials", {issuer: "pkoch", credential_type: "toy", content: JSON.stringify({"it's an": "airplane"})})
await new Promise(resolve => setTimeout(resolve, 2 * 1000))
access_grant = await idos.grants.create("credentials", record.id, "ed25519:9r78Bid58xWmJZ1suyVZb1qLus8JNt1oXxuQUwcy9cat", '5erx4hp8F9zbta+Pl526R9Y5oVGIIQni6AvjLFFkKxQ=')

*/
/* Using 8371e11cabf6552ac19f383a3d689d846d543c97e999c1f4f9bcf9ac086d2d39:
await idos.grants.list("credentials", {grantee: "8371e11cabf6552ac19f383a3d689d846d543c97e999c1f4f9bcf9ac086d2d39"})
*/
/*
await signer.signAndSendTransaction({
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "insert_grant",
              args: { grantee: "ed25519:9r78Bid58xWmJZ1suyVZb1qLus8JNt1oXxuQUwcy9cat", data_id: "ai ui um data id"},
              gas: "30000000000000",
            },
          },
        ],
      });


const accountId = "a80319daaca7a9d6c2570efa3f1e39ed3ff742d3deab41b281dc31ce0f914596";
const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
const nearConnection = await nearAPI.connect({
  networkId: "testnet",
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
});

const account = await nearConnection.account(accountId);
window.contract = new nearAPI.Contract(account, "idos-dev-3.testnet", {
  viewMethods: ["find_grants"],
  changeMethods: [
    "insert_grant",
    "delete_grant",
  ],
});


*/


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
    await provider.send("wallet_switchEthereumChain", [{ chainId: "0x5" }]);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    return { signer, address: signer.address };
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

    window.selector = selector;
    const signer = await selector.wallet();
    window.signer = signer;
    return { signer, address: (await signer.getAccounts())[0].accountId };
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
  const { signer, address } = await terminal
    .h1("rocket", "idOS connection")
    .h2("Node URL")
    .log(idos.nodeUrl)
    .wait("awaiting wallet", connectWallet[chosenWallet]());

  if (!address) return;


  /*
   * Are you in the idOS?
   *
   */
  const hasProfile = await terminal.wait(
    `checking if idOS profile exists`,
    idos.hasProfile(address),
  );

  if (!hasProfile) {
    terminal
      .h1("pleading", `No idOS profile found for ${address}`)
      .h2(`Need an idOS profile?`)
      .log(`Get one at <a href="${idOS.profileProviders[0]}">Fractal ID</a>`)
      .h2(`Already have one?`)
      .log(`Please connect with the right address`)
      .status("done", "Done");
    return;
  }


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
   * Setting the signer right before querying
   *
   */
  if (!Object.values(chosenFlow).includes(true)) return;

  const { publicKey } = await terminal.wait(
    "awaiting idOS authentication (signatures and password)",
    idos.setSigner(chosenWallet, signer),
  );
  window.signerPublicKey = publicKey;

  if (!idos.crypto.initialized) {
    await terminal
        .wait("Initting crypto", idos.crypto.init())
  }
  await terminal
      .h1("key", "idOS.crypto.publicKey")
      .wait("Getting it", idos.crypto.publicKey)
  terminal.log(await idos.crypto.publicKey)

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
    const issuedGrants = cache.get("grants") || idos.grants.list({ owner: signerPublicKey });
    terminal.h1("eyes", "Your issued grants (we're the owner)").wait("awaiting RPC", issuedGrants);
    terminal.table(await issuedGrants, ["owner", "grantee", "data_id", "lockedUntil"]);
    cache.set("grants", await issuedGrants);

    const receivedGrants = idos.grants.list({ grantee: signerPublicKey });
    terminal.h1("eyes", "Your received grants (we're the grantee)").wait("awaiting RPC", receivedGrants);
    terminal.table(await receivedGrants, ["owner", "grantee", "data_id", "lockedUntil"], {
      data_id: async (data_id) => {
        await idos.grants.get_credential_shared({id: data_id});
        await terminal
          .wait("verifying credential...", idOS.verifiableCredentials.verify((await credential).content))
          .then(_ => terminal.status("done", "Verified"))
          .catch(terminal.error.bind(terminal));
        terminal
          .h1("eyes", "Content")
          .json(JSON.parse((await credential).content));
      },
    });
  }

  terminal.status("done", "Done");
})();
