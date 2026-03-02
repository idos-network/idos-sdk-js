# idOS FaceSign Enclave

A secure signing enclave application that can be embedded in 3rd party applications via iframe or used as a popup window.

## Features

- 🔐 Secure key storage using encrypted IndexedDB
- 🖼️ Embeddable via iframe or popup window
- ✍️ Cryptographic signing with NaCl (Ed25519)
- 🔒 Origin validation for secure cross-window communication
- 📱 Mobile handoff — desktop users can delegate FaceTec liveness to a mobile device via QR code
- 📱 Responsive UI with session and signature approval flows

## Embedding in Your Application

TODO:

### Quick Example

TODO:

## Development

### Prerequisites

- Node.js (v18 or higher)
- pnpm (monorepo uses pnpm workspaces)

### Setup

From the monorepo root:

```bash
pnpm install
pnpm --filter facesign-enclave dev
```

Or from this directory:

```bash
pnpm dev
```

Vite assigns the first available port starting from 5173. When running alongside the dashboard (which typically occupies `https://localhost:5173`), the enclave will be at `https://localhost:5174`. Both apps serve over HTTPS via `mkcert`.

### Environment Variables

Create a `.env.local` file with (all required unless noted):

```bash
# Service URLs
VITE_FACESIGN_SERVICE_URL=https://facesign.staging.sandbox.fractal.id/
VITE_ENTROPY_SERVICE_URL=https://entropy.staging.sandbox.fractal.id/

# FaceTec configuration
VITE_FACETEC_DEVICE_KEY_IDENTIFIER="your-device-key"
VITE_FACETEC_IFRAME_FEATURE_FLAG="your-iframe-feature-flag-uuid"

# Allowed parent origins for iframe embedding (comma-separated)
# Use "*" for development, specific origins for production
VITE_ALLOWED_ORIGINS="*"

# Upstash Redis (for mobile handoff sessions) — provided by the Vercel KV integration
KV_REST_API_URL="https://your-instance.upstash.io"
KV_REST_API_TOKEN="your-token"
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_FACESIGN_SERVICE_URL` | Yes | FaceSign backend service endpoint. |
| `VITE_ENTROPY_SERVICE_URL` | Yes | Entropy service endpoint for key derivation. |
| `VITE_FACETEC_DEVICE_KEY_IDENTIFIER` | Yes | FaceTec device key identifier. |
| `VITE_FACETEC_IFRAME_FEATURE_FLAG` | Yes | FaceTec iframe feature flag UUID. |
| `VITE_ALLOWED_ORIGINS` | Yes | Comma-separated origins allowed to embed the enclave. Use `"*"` for development only. |
| `KV_REST_API_URL` | Yes | Upstash Redis REST URL for mobile handoff sessions. |
| `KV_REST_API_TOKEN` | Yes | Upstash Redis REST token. |

### Running with the dashboard

To test the full FaceSign flow locally, both apps must be running simultaneously:

1. **Terminal 1** -- Start the dashboard:

   ```bash
   pnpm --filter idos-data-dashboard dev
   ```

2. **Terminal 2** -- Start the FaceSign enclave:

   ```bash
   pnpm --filter facesign-enclave dev
   ```

3. Ensure the dashboard's `VITE_FACESIGN_ENCLAVE_URL` (in `apps/idos-data-dashboard/.env.local`) matches the enclave's URL (e.g., `https://localhost:5174`).

4. Ensure the enclave's `VITE_ALLOWED_ORIGINS` includes the dashboard's origin (`https://localhost:5173` or `"*"` for development).

### Testing the iframe embedding

A standalone test page is provided for manual testing without the dashboard:

1. Start the dev server: `pnpm dev`
2. Open **https://localhost:5174/iframe-test.html** in your browser.

The test page includes:

- **Page** selector (Home / Login) to load the enclave at `/` or `/login`
- **Device** selector to simulate viewport width (Mobile, Tablet, Desktop, Large, Full)
- **Send session proposal** / **Send sign proposal** to postMessage into the iframe
- **Clear all storage** to clear localStorage, sessionStorage, IndexedDB, and cookies and reload the iframe

Responses from the enclave appear in a fixed panel at the bottom right.

### Build

```bash
pnpm build
pnpm preview
```

## Deployment

The FaceSign enclave is deployed to [Vercel](https://vercel.com) and available at [facesign-enclave.idos.network](https://facesign-enclave.idos.network). The app uses React Router 7 in SSR mode with the `@vercel/react-router` preset.

### Prerequisites

1. **Vercel KV (Upstash Redis)** — enable the Vercel KV integration on the project. This automatically provisions `KV_REST_API_URL` and `KV_REST_API_TOKEN` as environment variables.
2. **FaceTec domain whitelist** — ensure the production domain (and the mobile handoff domain, which is the same) is whitelisted in the FaceTec developer dashboard.

### Vercel environment variables

Set these in the Vercel project settings (KV variables are auto-provisioned by the integration):

| Variable | Value | Notes |
| --- | --- | --- |
| `VITE_FACESIGN_SERVICE_URL` | Production FaceSign service URL | |
| `VITE_ENTROPY_SERVICE_URL` | Production entropy service URL | |
| `VITE_FACETEC_DEVICE_KEY_IDENTIFIER` | Production FaceTec device key | |
| `VITE_FACETEC_IFRAME_FEATURE_FLAG` | Production FaceTec iframe feature flag | |
| `VITE_ALLOWED_ORIGINS` | `https://dashboard.idos.network` | Never use `"*"` in production |
| `KV_REST_API_URL` | *(auto-provisioned by Vercel KV)* | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | *(auto-provisioned by Vercel KV)* | Upstash Redis REST token |

The `VITE_ALLOWED_ORIGINS` variable controls which parent origins can embed the enclave via iframe **and** which origins can call the handoff API routes (via CORS). In production, this must be an explicit list of trusted origins.

### Post-deploy testing

See the **Testing the mobile handoff** section below for a verification checklist.

## Mobile Handoff

The mobile handoff feature allows desktop users to delegate FaceTec liveness verification to a mobile device. This is useful when the desktop browser doesn't support camera access or when the user prefers to use their phone.

### How it works

1. **Dashboard** (desktop) creates a handoff session via `POST /api/handoff` and displays a QR code.
2. **User** scans the QR code on their phone, which opens `/m/:sessionId`.
3. **Mobile page** runs FaceTec liveness and POSTs the attestation token to `POST /api/handoff/:sessionId`.
4. **Dashboard** polls `GET /api/handoff/:sessionId?secret=...` until the session is completed, then retrieves the attestation token.
5. **Dashboard** sends the token to the enclave iframe via `postMessage`, which derives the key pair and returns the public address.

Sessions are stored in Upstash Redis with a 5-minute TTL. The `secret` query parameter prevents unauthorized polling.

### API routes

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/handoff` | Creates a new session. Returns `{ sessionId, secret }`. |
| `GET` | `/api/handoff/:sessionId?secret=...` | Polls session status. Returns `{ status, attestationToken? }`. Deletes session on completed read. |
| `POST` | `/api/handoff/:sessionId` | Completes a session. Body: `{ attestationToken }`. |

### Testing the mobile handoff

**1. Verify Upstash Redis connectivity**

```bash
# Create a session
curl -s -X POST https://<enclave-url>/api/handoff | jq

# Expected: { "sessionId": "...", "secret": "..." }
```

**2. Verify session lifecycle**

```bash
# Using the sessionId and secret from step 1:

# Poll (should be pending)
curl -s "https://<enclave-url>/api/handoff/<sessionId>?secret=<secret>" | jq
# Expected: { "status": "pending" }

# Complete the session
curl -s -X POST "https://<enclave-url>/api/handoff/<sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"attestationToken": "test-token"}' | jq
# Expected: { "ok": true }

# Poll again (should be completed, then deleted)
curl -s "https://<enclave-url>/api/handoff/<sessionId>?secret=<secret>" | jq
# Expected: { "status": "completed", "attestationToken": "test-token" }
# Subsequent polls: { "error": "Not found" }
```

**3. Verify mobile page renders**

Open `https://<enclave-url>/m/<sessionId>` in a mobile browser (use a valid session ID). You should see the "Start Face Scan" button.

**4. Verify CORS**

```bash
# Should return Access-Control-Allow-Origin matching the dashboard origin
curl -s -I -X OPTIONS "https://<enclave-url>/api/handoff" \
  -H "Origin: https://dashboard.idos.network"
```

**5. End-to-end flow (from the dashboard)**

1. Open the dashboard and trigger FaceSign (either from the banner or the connect wallet page).
2. Click "Continue on Mobile" — a QR code should appear.
3. Scan the QR code on a phone — the mobile page should load with "Start Face Scan".
4. Complete the face scan on mobile — the dashboard should detect completion and proceed.

## Security

### Origin Validation

The enclave validates incoming postMessage origins based on `VITE_ALLOWED_ORIGINS`:

- **Development**: Set to `"*"` to allow any origin
- **Production**: Set to comma-separated list of allowed origins: `"https://app1.com,https://app2.com"`

### Storage

- Uses IndexedDB (database `idOS:facesign`, object store `idOS:facesign:keystore`) for encrypted key storage
- Encryption key (KEK) stored under key `idOS:facesign:kek`
- Mnemonic encrypted with AES-GCM and stored under key `idOS:facesign:mnemonic`

### Communication

- postMessage API for cross-window communication
- Origin validation on all incoming messages
- Separate handling for iframe and popup window modes

## Architecture

- **React**: UI framework
- **React Router 7** (framework mode, SSR): File-based routing with server-side loaders/actions
- **Vite**: Build tool and dev server
- **Tailwind CSS v4**: Styling
- **shadcn/ui**: UI components (Button, Alert, Spinner)
- **NaCl (tweetnacl)**: Cryptographic signing
- **BIP39**: Mnemonic generation
- **Upstash Redis**: Temporary session storage for mobile handoff (via Vercel KV integration)

## License

MIT - See [LICENSE](./LICENSE) for details

## Support

For issues or questions, please visit: https://github.com/idos-network/idos-sdk-js
