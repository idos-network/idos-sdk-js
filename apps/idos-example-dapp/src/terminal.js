export class Terminal {
  constructor(selector) {
    const wrapper = document.querySelector(selector);
    wrapper.style.display = "block";

    this.elem = wrapper.children.display;
    this.restartButton = wrapper.querySelector("button");

    this.restartButton.addEventListener("click", e => window.location.reload());

    return this;
  }

  #append(elem, str) {
    elem.innerHTML += str;
  }

  log(html, nest = false) {
    html = /^<\/?[a-z][\s\S]*>$/i.test(html) ? html : `<span>${html}</span>`;

    this.#append(nest ? this.elem.lastChild : this.elem, html);

    return this;
  }


  br(count = 1) {
    [...Array(count)].map(() => this.log(`<br>`));

    return this;
  }

  header(icon, html, nest = false) {
    return this.log(`<span class="header ${icon}">${html}</span>`, nest)
  }
  
  table(items, keys) {
    items = Array.isArray(items) ? items : [items];

    keys = keys
      ? keys.map(key => key
        .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/g, " ")
      )
      : Object.keys(items[0]);

    return this.log(`
      <div class="table">
        <div class="thead">
          ${keys.reduce((row, key) => row + `
            <div>
              <span>
                ${key}
              </span>
            </div>
          `, "")}
        </div>

        ${items
          .map(item => keys.map(key => item[key]))
          .reduce((row, values) => row + `
            <div>
              ${values.reduce((row, v) => row + `<div>${v}</div>`, "")}
            </div>
          `, "")}
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
    } catch (e) {
      this.waitElem.classList.add("fail");
      this.restartButton.style.display = "block";
    }

    return this;
  }

  done() {
    this.status("done");
    this.restartButton.style.display = "block";
  }
}
