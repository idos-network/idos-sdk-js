export class Terminal {
  constructor(selector, idos) {
    const wrapper = document.querySelector(selector);

    this.overviewElem = wrapper.children.overview;
    this.detailElem = wrapper.querySelector("#detail");
    this.controlsElem = wrapper.children.controls;

    this.currentElem = this.overviewElem;

    document.querySelector("button#close").addEventListener("click", e => {
      this.detailElem.parentElement.style.display = "none";
      this.detailElem.innerHTML = "";
      this.currentElem = this.overviewElem;
    });

    this.restartButton = wrapper.querySelector("button.restart");
    this.restartButton.addEventListener("click", e => (
      window.location = window.location.origin
    ));

    this.resetDappButton = wrapper.querySelector("button.reset-dapp");
    this.resetDappButton.addEventListener("click", async e => {
      window.localStorage.clear();
      await idos.reset();
      window.location = window.location.origin;
    });

    this.resetFullButton = wrapper.querySelector("button.reset-full");
    this.resetFullButton.addEventListener("click", async e => {
      window.localStorage.clear();
      await idos.reset({ enclave: true })
      window.location = window.location.origin;
    });

    window.terminalHandlers = {};
    return this;
  }

  log(str) {
    this.currentElem.innerHTML += /^<.*>$/.test(str) ? str : `<span>${str}</span>`;

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

    const allKeys =
      Object.keys(wrappedItems[0] || Object.fromEntries(keyFilter.map(e => [e])));
    if (!allKeys.length) throw new Error(`No keys in ${JSON.stringify(items)}`);

    const keys = keyFilter.length ? keyFilter : allKeys;
    const headers = keys.map(key =>
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
            ${headers.reduce((row, header) => row + `
              <div class="td"><span>${header}</span></div>
            `, "")}
          </div>
        </div>

        <div class="tbody">
        ${wrappedItems
          .map(item => keys.map(key => [key, item[key]]))
          .reduce((row, values) => row + `
            <div class="tr">
              ${values.reduce((row, [key, value]) => row + `
                <div class="td">
                  ${handlers?.[key]
                    ? `<a onclick="terminalHandlers['${handlerId}']['${key}']('${value}')">${value}</a>`
                    : value
                  }
                </div>
              `, "")}
            </div>
          `, "")}
        </div>
      </div>
    `);
  }

  status(className, html="") {
    return this.log(`<span class="status ${className}">${html}</span>`);
  }

  detail(object) {
    this.detailElem.parentElement.style.display = "block";
    this.currentElem = this.detailElem;

    if (!object) return this;

    return this.log(typeof object === "object"
      ? `<pre>${JSON.stringify(object, "", 2)}</pre>`
      : object
    );
  }

  async wait(html, promise) {
    this.status("wait", html);
    this.waitElem = this.currentElem.lastChild;

    try {
      await promise;
      this.waitElem.remove();
      return promise;
    } catch (e) {
      this.waitElem.classList.add("fail");
      this.controlsElem.style.display = "block";
      console.warn(e);
      throw e;
    }
  }

  done() {
    this.status("done");
  }
}
