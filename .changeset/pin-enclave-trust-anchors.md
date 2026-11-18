---
"facesign-enclave": patch
"idos-enclave": patch
---

Pin the FaceSign service URLs, allowed origins, FaceTec settings and MPC configuration in source, chosen by the page's hostname, so a Vercel environment variable can no longer change them on a deployed host. The FaceSign handoff store only accepts the idOS Upstash host; the dev server may also use a Redis REST endpoint on loopback. Production FaceSign no longer accepts staging and playground origins.
