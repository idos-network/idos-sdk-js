export class Terminal {
  constructor(selector, idos) {
    const wrapper = document.querySelector(selector);

    this.elem = wrapper.children.display;
    this.controls = wrapper.children.controls;

    this.restartButton = wrapper.querySelector("button#restart");
    this.restartButton.addEventListener("click", e => window.location.reload());

    this.changeSignerButton = wrapper.querySelector("button#change-signer");
    this.changeSignerButton.addEventListener("click", async e => {
      await idos.reset({ keep: ["password"] });
      window.location.reload();
    });

    return this;
  }

  log(str) {
    this.elem.innerHTML += /^<.*>$/.test(str) ? str : `<span>${str}</span>`;

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
  
  table(items, keys) {
    items = Array.isArray(items) ? items : [items];
    keys = keys || Object.keys(items[0]);

    const headers = keys.map(key =>
      key
        .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/g, " ")
    );

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
        ${items
          .map(item => keys.map(key => item[key]))
          .reduce((row, values) => row + `
            <div class="tr">
              ${values.reduce((row, v) => row + `
                <div class="td">${v}</div>
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

  async wait(html, promise) {
    this.status("wait", html);
    this.waitElem = this.elem.lastChild;

    try {
      await promise;
      this.waitElem.remove();
      return promise;
    } catch (e) {
      this.waitElem.classList.add("fail");
      this.controls.style.display = "block";
      console.warn(e);
      throw new Error("Error in promise");
    }
  }

  done() {
    this.status("done");
  }
}
