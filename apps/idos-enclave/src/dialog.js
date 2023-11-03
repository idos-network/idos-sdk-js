import { generateMnemonic } from "web-bip39";
import wordlist from "web-bip39/wordlists/english";
import "./styles.css";

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
  };

  listenToEnclave = () => {
    window.addEventListener("message", async (event) => {
      if (event.source !== enclave) {
        return;
      }

      const requestName = event.data;

      if (requestName !== "password" && requestName !== "consent") {
        throw new Error(`Unexpected request from parent: ${requestName}`);
      }
      this.responsePort = event.ports[0];
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
