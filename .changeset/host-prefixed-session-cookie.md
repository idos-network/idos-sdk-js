---
"data-dashboard": patch
"facesign-enclave": patch
---

Name the session cookie `__Host-session` when it is Secure, so a sibling subdomain can no longer plant or shadow it (session fixation). Existing sessions are logged out once.
