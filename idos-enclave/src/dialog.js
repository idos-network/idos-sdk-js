const enclave = window.opener;

if (enclave.origin === window.origin) {
  document.querySelector("form[name=password]").addEventListener("submit", (e) => {
    e.preventDefault();

    const password = Object.fromEntries(new FormData(e.target).entries());

    enclave.postMessage({dialog: { password }}, enclave.origin);
  });
}
