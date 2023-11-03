import { generateMnemonic } from "web-bip39";
import wordlist from "web-bip39/wordlists/english";
import "./styles.css";

const base64ToArrayBuffer = (base64) => (
  Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
);

const arrayBufferToBase64 = (bytes) => (
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
);


class Dialog {
  constructor(enclave, intent, message) {
    if (enclave.origin !== window.origin) {
      throw new Error("Wrong enclave origin, aborting.");
    }

    this.enclave = enclave;
    this.intent = intent;
    this.message = message;

    this.listenToEnclave();
    this.initUi();
  }

  initUi = () => {
    const beforeUnload = e => {
      e.preventDefault();
      e.returnValue = ""
      this.respondToEnclave({ error: "closed" });
    };
    window.addEventListener("beforeunload", beforeUnload);

    if (this.intent === "passkey") return;

    const passwordForm = document.querySelector("form[name=password]");
    const passwordInput = passwordForm.querySelector("input[type=password]");
    const bip39Display = passwordForm.querySelector("#bip39_display");
    const bip39Button = passwordForm.querySelector("button#bip39");

    document.querySelector(`[name=${this.intent}]`).style.display = "block";
    document.querySelector("#message").innerHTML = this.message;

    passwordInput.focus();

    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      window.removeEventListener("beforeunload", beforeUnload);
      const password = Object.fromEntries(new FormData(e.target).entries());
      this.respondToEnclave({ result: password });
    });

    /*
    bip39Button.addEventListener("click", async (e) => {
      e.preventDefault();
      const seed = await generateMnemonic(wordlist);
      passwordInput.value = seed;
      const words = seed.split(" ");
      const wordGroups = [];

      while (words.length > 0) {
        wordGroups.push(words.splice(0, 4).join(" "));
      }

      bip39Display.innerText = wordGroups.join("\n");
      bip39Display.style.display = "block";
    });
    */

    document.querySelectorAll("form[name=consent] button").forEach((elem) =>
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        window.removeEventListener("beforeunload", beforeUnload);
        const consent = e.target.id === "yes";
        this.respondToEnclave({ result: { consent } });
      })
    );

    document.querySelectorAll("form[name=passkey] button").forEach((elem) =>
      elem.addEventListener("click", async (e) => {
        e.preventDefault();
        //window.removeEventListener("beforeunload", beforeUnload);
        const password = await (e.target.id === "findOrCreate" ? this.passkey1() : this.passkey2());
        this.respondToEnclave({ result: { password, duration: 7 } });
      })
    );
  };

  passkey1 = async () => {
    console.warn("checking if one exists...");
    const challenge = crypto.getRandomValues(new Uint8Array(10));

    const credentialId = window.localStorage.getItem("idOS-credential-id");

    let credential;
    let publicKey;
    try {
      publicKey = {
        challenge: challenge,
        //rpId: "idos.network",
      }

      if (credentialId !== null) {
        publicKey.allowCredentials = [{
          id: base64ToArrayBuffer(credentialId),
          type: "public-key",
        }];
      }

      credential = await navigator.credentials.get({ publicKey });

      if (credential !== null) {
        console.warn("already exists");
        const password = new TextDecoder().decode(credential.response.userHandle);
        window.localStorage.setItem("idOS-credential-id", arrayBufferToBase64(credential.rawId));
        return { password, credentialId };
      }
    } catch (e) {
      // user cancelled passkey lookup; let's create one
      console.warn("no thanks i don't want to reuse");
    }

    console.warn("creating...");

    const password = window.prompt("IDOS password");

    if (password === null) {
      console.warn("user cancelled prompt");
      return;
    }

    try {
      publicKey = {
        challenge: challenge,
        rp: {
          // id: "idos.network",
          name: "IDOS",
        },
        user: {
          id: new TextEncoder().encode(password),
          name: "idos user",
          displayName: "idos user"
        },
        pubKeyCredParams: [ {type: "public-key", alg: -7} ]
      };

      credential = await navigator.credentials.create({ publicKey });

      window.localStorage.setItem("idOS-credential-id", arrayBufferToBase64(credential.rawId));

      console.warn("created");
    } catch (e) {
      console.warn("user cancelled creation");
      throw(e);
    }

    return { password, credentialId };
  };

  passkey2 = async () => {
    const publicKey = {
      challenge: crypto.getRandomValues(new Uint8Array(10)),
      //rpId: "idos.network",
    };

    const credentialId = window.localStorage.getItem("idOS-credential-id");

    if (credentialId !== null) {
      publicKey.allowCredentials = [{
        id: base64ToArrayBuffer(credentialId),
        type: "public-key",
      }];
    }

    const credential = await navigator.credentials.get({ publicKey });
    const password = new TextDecoder().decode(credential.response.userHandle);

    return password;
  };

  listenToEnclave = async () => {
    window.addEventListener("message", async (event) => {
      if (event.source !== enclave) {
        return;
      }

      this.responsePort = event.ports[0];

      const requestName = event.data;

      switch(requestName) {
        case "passkey":
          const { password, credentialId } = await this.passkey1();
          this.respondToEnclave({ result: { password, credentialId, duration: 7 } });
          break;
        case "password":
        case "consent":
          break;
        default:
          throw new Error(`Unexpected request from parent: ${requestName}`);
      }

    });
  };

  respondToEnclave = (message) => {
    this.responsePort.postMessage(message);
    this.responsePort.close();
  };
}

const enclave = window.opener;
const { intent, message } = Object.fromEntries(
  Array.from(new URLSearchParams(document.location.search))
);
new Dialog(enclave, intent, message);
