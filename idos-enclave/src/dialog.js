const enclave = window.opener;

if (enclave.origin === window.origin) {
  const { intent, message } = Object.fromEntries(Array.from(
    new URLSearchParams(document.location.search),
  ));

  document.querySelector(`[name=${intent}]`).style.display = "block";
  document.querySelector("#message").innerHTML = message;

  document.querySelector("form[name=password]").addEventListener("submit", (e) => {
    e.preventDefault();

    const password = Object.fromEntries(new FormData(e.target).entries());

    enclave.postMessage({ passworded: { password } }, enclave.origin);
  });

  document.querySelectorAll("form[name=consent] button").forEach((elem) => elem.addEventListener("click", (e) => {
    e.preventDefault();

    enclave.postMessage({ consented: { consent: e.target.id === "yes"} }, enclave.origin);
  }));
}
