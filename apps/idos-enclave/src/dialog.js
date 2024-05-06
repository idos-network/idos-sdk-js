import { Store } from "@idos-network/idos-store";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import * as DOMPurify from "dompurify";
import "./styles.css";

const sanitize = (html) => DOMPurify.default.sanitize(html, { ALLOWED_TAGS: [] });

class Dialog {
  constructor() {
    this.enclave = window.opener;
    if (this.enclave.origin !== window.origin) throw new Error("Bad origin");

    this.store = new Store();
    this.initUi();
    this.listenToEnclave();
  }

  initUi() {
    this.authContainer = document.querySelector("#auth-method");
    this.beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      this.respondToEnclave({ error: "closed" });
    };
    window.addEventListener("beforeunload", this.beforeUnload);
  }

  async confirmForm({ message, origin, remember }) {
    message = sanitize(message);
    origin = sanitize(origin);

    const confirmForm = document.querySelector("form[name=confirm]");
    confirmForm.style.display = "block";
    confirmForm.querySelector("#origin").innerHTML = origin;
    confirmForm.querySelector("#message").innerHTML = message;
    confirmForm.querySelector("#remember").hidden = !remember;

    return new Promise((resolve) =>
      confirmForm.addEventListener("submit", (e) => {
        e.preventDefault();
        resolve({
          confirm: e.submitter.id === "yes",
          remember: confirmForm.querySelector('#remember input[name="remember"]').checked,
        })
      }),
    );
  }

  async passwordForm() {
    this.authContainer.style.display = "none";
    const passwordForm = document.querySelector("form[name=password]");
    passwordForm.style.display = "block";
    passwordForm.querySelector("input[type=password]").focus();

    return new Promise((resolve) =>
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.authContainer.style.display = "flex";
        passwordForm.style.display = "none";
        resolve(Object.fromEntries(new FormData(e.target).entries()));
      }),
    );
  }

  async password() {
    const { password, duration } = await this.passwordForm();
    this.respondToEnclave({ result: { password, duration } });
  }

  async passkey({ message: { type } }) {
    try {
      if (type === "password") {
        const { password } = await this.getOrCreatePasswordCredential();
        this.respondToEnclave({ result: { password } });
      } else if (type === "webauthn") {
        const { password, credentialId } = await this.getOrCreateWebAuthnCredential();
        this.respondToEnclave({ result: { password, credentialId } });
      }
    } catch (e) {
      this.respondToEnclave({ error: e.toString() });
    }
  }

  async confirm({ message: { message, origin, remember = false } }) {
    this.authContainer.style.display = "none";
    const result = await this.confirmForm({ message, origin, remember });

    this.respondToEnclave({ result });
    this.authContainer.style.display = "flex";
  }

  async getOrCreatePasswordCredential() {
    const credential = await navigator.credentials.get({ password: true });

    if (credential) return { password: credential.password };

    await navigator.credentials.store(
      new PasswordCredential({
        id: "idos",
        name: "idOS user",
        password: Base64Codec.encode(crypto.getRandomValues(new Uint8Array(32))),
      }),
    );

    const password = await new Promise((resolve) =>
      setInterval(async () => {
        const credential = await navigator.credentials.get({ password: true });
        if (credential) resolve(credential.password);
      }, 100),
    );

    return { password };
  }

  async getOrCreateWebAuthnCredential() {
    let credential;
    let credentialId;
    let password;

    const storedCredentialId = this.store.get("credential-id");

    if (storedCredentialId) {
      const credentialRequest = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(10)),
          allowCredentials: [
            {
              type: "public-key",
              id: Base64Codec.decode(storedCredentialId),
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
        },
      };

      try {
        credential = await navigator.credentials.get(credentialRequest);
        password = Utf8Codec.decode(new Uint8Array(credential.response.userHandle));
        credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));
      } catch (e) {}
    } else {
      const displayName = "idOS User";
      password = Base64Codec.encode(crypto.getRandomValues(new Uint8Array(32)));

      credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(10)),
          rp: { name: "idOS.network" },
          user: {
            id: Utf8Codec.encode(password),
            displayName,
            name: displayName,
          },
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7,
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
        },
      });
    }

    credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

    this.store.set("credential-id", credentialId);
    this.store.set("password", password);

    return { password, credentialId };
  }

  async #authWithPassword() {
    this.authContainer.style.display = "none";
    await this.password();
    this.store.set("preferred-auth-method", "password");
  }

  async #authWithPasskey() {
    this.authContainer.style.display = "none";
    await this.passkey({
      message: { type: "webauthn" },
    });
    this.store.set("preferred-auth-method", "webauthn");
  }

  async auth() {
    this.authContainer.style.display = "flex";
    const passwordMethod = document.querySelector("#auth-method-password");
    const passkeyMethod = document.querySelector("#auth-method-passkey");

    return new Promise((resolve) => {
      passwordMethod.addEventListener("click", async () => {
        await this.#authWithPassword();
        resolve();
      });

      passkeyMethod.addEventListener("click", async () => {
        await this.#authWithPasskey();
        resolve();
      });
    });
  }

  async listenToEnclave() {
    window.addEventListener("message", async (event) => {
      if (event.source !== this.enclave) return;

      const { data: requestData, ports } = event;

      if (!["passkey", "password", "confirm", "auth"].includes(requestData.intent))
        throw new Error(`Unexpected request from parent: ${requestData.intent}`);

      this.responsePort = ports[0];

      this[requestData.intent](requestData);
    });
  }

  respondToEnclave(message) {
    this.responsePort.postMessage(message);

    window.removeEventListener("beforeunload", this.beforeUnload);
    this.responsePort.close();
  }
}

new Dialog();
