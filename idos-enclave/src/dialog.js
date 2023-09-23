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
    document.querySelector(`[name=${this.intent}]`).style.display = "block";
    document.querySelector("#message").innerHTML = this.message;

    document
      .querySelector("form[name=password]")
      .addEventListener("submit", (e) => {
        e.preventDefault();

        const password = Object.fromEntries(new FormData(e.target).entries());

        this.respondToEnclave({ result: password });
      });

    document
      .querySelectorAll("form[name=consent] button")
      .forEach((elem) => elem.addEventListener("click", (e) => {
        e.preventDefault();

        const consent = e.target.id === "yes";

        this.respondToEnclave({ result: { consent } });
      }));
  }

  listenToEnclave = () => {
    window.addEventListener("message", async (event) => {
      if (event.source !== enclave) { return; }

      const requestName = event.data;

      if (requestName !== "password" && requestName !== "consent") {
        throw new Error(`Unexpected request from parent: ${requestName}`);
      }

      this.responsePort = event.ports[0];
    });
  }

  respondToEnclave = (message) => {
    this.responsePort.postMessage(message);
    this.responsePort.close();
  };
}

const enclave = window.opener;
const { intent, message } = Object.fromEntries(Array.from(
  new URLSearchParams(document.location.search),
));

new Dialog(enclave, intent, message);
