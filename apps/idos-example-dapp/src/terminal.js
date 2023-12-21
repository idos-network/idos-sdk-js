export class Terminal {
  constructor(selector, idos) {
    const wrapper = document.querySelector(selector);

    this.overviewElem = wrapper.children.overview;
    this.detailElem = wrapper.querySelector("#detail");
    this.controlsElem = wrapper.children.controls;

    this.currentElem = this.overviewElem;

    document.querySelector("button#close").addEventListener("click", (e) => {
      this.detailElem.parentElement.classList.remove("visible");
      this.detailElem.innerHTML = "";
      this.currentElem = this.overviewElem;
    });

    this.restartButton = wrapper.querySelector("button.restart");
    this.restartButton.addEventListener("click", (e) => (window.location = window.location.origin));

    this.resetDappButton = wrapper.querySelector("button.reset-dapp");
    this.resetDappButton.addEventListener("click", async (e) => {
      window.localStorage.clear();
      await idos.reset();
      window.location = window.location.origin;
    });

    this.resetFullButton = wrapper.querySelector("button.reset-full");
    this.resetFullButton.addEventListener("click", async (e) => {
      window.localStorage.clear();
      await idos.reset({ enclave: true });
      window.location = window.location.origin;
    });

    window.terminalHandlers = {};
    return this;
  }

  log(str) {
    this.currentElem.innerHTML += /^<.*>$/.test(str) ? str : `<span>${str}</span>`;

    this.overviewElem.scrollTo({
      top: this.overviewElem.scrollHeight,
      behavior: "smooth"
    });

    return this;
  }

  br(count = 1) {
    [...Array(count)].map(() => this.log(`<br>`));

    return this;
  }

  h1(icon, html) {
    return this.log(`<span class="h1 ${icon}">${html}</span>`);
  }

  h2(html) {
    return this.log(`<span class="h2"><span>${html}</span></span>`);
  }

  table(items = [], keyFilter = [], handlers) {
    const wrappedItems = Array.isArray(items) ? items : [items];

    const allKeys = Object.keys(wrappedItems[0] || Object.fromEntries(keyFilter.map((e) => [e])));
    if (!allKeys.length) throw new Error(`No keys in ${JSON.stringify(items)}`);

    const keys = keyFilter.length ? keyFilter : allKeys;
    const headers = keys.map((key) =>
      key
        .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/g, " ")
    );

    const handlerId = crypto.randomUUID();
    if (handlers) window.terminalHandlers[handlerId] = handlers;

    return this.log(`
      <div class="table">
        <div class="thead">
          <div class="tr">
            ${headers.reduce(
              (row, header) =>
                row +
                `
              <div class="td"><span>${header}</span></div>
            `,
              ""
            )}
          </div>
        </div>

        <div class="tbody">
        ${wrappedItems
          .map((item) => keys.map((key) => [key, item[key]]))
          .reduce(
            (row, values) =>
              row +
              `
            <div class="tr">
              ${values.reduce(
                (row, [key, value]) =>
                  row +
                  `
                <div class="td">
                  ${
                    handlers?.[key]
                      ? `<a onclick="terminalHandlers['${handlerId}']['${key}']('${value}')">${value}</a>`
                      : value
                  }
                </div>
              `,
                ""
              )}
            </div>
          `,
            ""
          )}
        </div>
      </div>
    `);
  }

  status(className, html = "") {
    return this.log(`<span class="status ${className}">${html}</span>`);
  }

  json(object) {
    const stringified = JSON.stringify(object, "", 2).replace(/"(data:.*?;).*/g, "$1 (...)");
    return this.log(`<pre>${stringified}</pre>`);
  }

  error(error) {
    return this.log(`<span class="error">${error.toString()}</span>`);
  }

  detail() {
    this.detailElem.innerHTML = "";
    this.detailElem.parentElement.classList.add("visible");
    this.currentElem = this.detailElem;

    return this;
  }

  async wait(html, promise, onError) {
    this.status("wait", html);
    this.waitElem = this.currentElem.lastChild;

    try {
      await promise;
      this.waitElem.remove();
      return promise;
    } catch (e) {
      console.warn(e);
      this.waitElem.classList.add("fail");
      throw e;
    }
  }
}
