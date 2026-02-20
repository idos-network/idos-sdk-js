# idOS FaceSign Enclave

A secure signing enclave application that can be embedded in 3rd party applications via iframe or used as a popup window.

## Features

- 🔐 Secure key storage using encrypted IndexedDB
- 🖼️ Embeddable via iframe or popup window
- ✍️ Cryptographic signing with NaCl (Ed25519)
- 🔒 Origin validation for secure cross-window communication
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
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_FACESIGN_SERVICE_URL` | Yes | FaceSign backend service endpoint. |
| `VITE_ENTROPY_SERVICE_URL` | Yes | Entropy service endpoint for key derivation. |
| `VITE_FACETEC_DEVICE_KEY_IDENTIFIER` | Yes | FaceTec device key identifier. |
| `VITE_FACETEC_IFRAME_FEATURE_FLAG` | Yes | FaceTec iframe feature flag UUID. |
| `VITE_ALLOWED_ORIGINS` | Yes | Comma-separated origins allowed to embed the enclave. Use `"*"` for development only. |

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

The FaceSign enclave is deployed to [Vercel](https://vercel.com) and available at [facesign-enclave.idos.network](https://facesign-enclave.idos.network).

### Vercel environment variables

Set these in the Vercel project settings:

| Variable | Value |
| --- | --- |
| `VITE_FACESIGN_SERVICE_URL` | Production FaceSign service URL |
| `VITE_ENTROPY_SERVICE_URL` | Production entropy service URL |
| `VITE_FACETEC_DEVICE_KEY_IDENTIFIER` | Production FaceTec device key |
| `VITE_FACETEC_IFRAME_FEATURE_FLAG` | Production FaceTec iframe feature flag |
| `VITE_ALLOWED_ORIGINS` | `https://dashboard.idos.network` (never use `"*"` in production) |

The `VITE_ALLOWED_ORIGINS` variable controls which parent origins can embed the enclave via iframe. In production, this must be an explicit list of trusted origins.

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
- **TanStack Router**: File-based routing (login, session, sign, wallet); protected routes via `beforeLoad` and router context
- **Vite**: Build tool and dev server
- **Tailwind CSS v4**: Styling
- **shadcn/ui**: UI components (Button, Alert, Spinner)
- **NaCl (tweetnacl)**: Cryptographic signing
- **BIP39**: Mnemonic generation

## License

MIT - See [LICENSE](./LICENSE) for details

## Support

For issues or questions, please visit: https://github.com/idos-network/idos-sdk-js
