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
pnpm install
pnpm dev
```

The application will be available at `https://localhost:5173` (HTTPS enabled via mkcert).

### Environment Variables

Create a `.env.local` file with (all required unless noted):

```bash
# Service URLs
VITE_FACESIGN_SERVICE_URL=https://facesign.staging.sandbox.fractal.id/
VITE_ENTROPY_SERVICE_URL=https://entropy.staging.sandbox.fractal.id/

# FaceTec configuration
VITE_FACETEC_DEVICE_KEY_IDENTIFIER="your-device-key"

# Allowed parent origins for iframe embedding (comma-separated)
# Use "*" for development, specific origins for production
VITE_ALLOWED_ORIGINS="*"
```

### Testing the Iframe Embedding

A test page is provided for manual testing:

1. Start the dev server: `pnpm dev`
2. Open **https://localhost:5173/iframe-test.html** in your browser.

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

## Security

### Origin Validation

The enclave validates incoming postMessage origins based on `VITE_ALLOWED_ORIGINS`:

- **Development**: Set to `"*"` to allow any origin
- **Production**: Set to comma-separated list of allowed origins: `"https://app1.com,https://app2.com"`

### Storage

- Uses IndexedDB for encrypted key storage
- Encryption key (KEK) is stored and cannot be extracted from IndexedDB 
- Mnemonic is encrypted with AES-GCM before storage

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
