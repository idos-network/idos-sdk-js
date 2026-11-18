---
"data-dashboard": patch
"embedded-wallet": patch
---

Pin the dashboard's and embedded wallet's enclave URLs, idOS node URL and wallet and dashboard origins in source, chosen by the page's hostname, so a Vercel environment variable can no longer change them on a deployed host. On the server, where there is no page hostname, the dashboard still reads its node URLs and `RELAY_URL` from the environment but accepts only idOS's own hosts, and fails closed before any request otherwise.
