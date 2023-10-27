export class Terminal {
  constructor(selector) {
    this.wrapper = document.querySelector(selector);
    this.#append(this.wrapper, `<code id="display"></code>`);
    this.elem = this.wrapper.children.display;
    this.wrapper.style.display = "block";

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
    return this.log(`
      <div class="table">
        <div class="thead">
          ${keys.reduce((row, key) => row + `
            <div>
              <span>
                ${key.toLowerCase().replaceAll(/[^a-z0-9]/g, " ")}
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
    }

    return this;
  }

  done() {
    return this.status("done");
  }

}
