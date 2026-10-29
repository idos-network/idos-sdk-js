---
"idos-enclave": patch
---

Drop origin authorizations stored before origin confirmation was required, so those sites have to ask again. New authorizations expire after 30 days, and the prompt now says how long the grant is remembered.

The unlock, confirm and backup buttons no longer stack a click handler per request, so one click opens one dialog.
