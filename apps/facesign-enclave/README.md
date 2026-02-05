# idOS FaceSign Enclave

A secure signing enclave application that can be embedded in 3rd party applications via iframe or used as a popup window.

## Features

- 🔐 Secure key storage using encrypted IndexedDB
- 🖼️ Embeddable via iframe or popup window
- 🔑 Passkey-based authentication
- ✍️ Cryptographic signing with NaCl (Ed25519)
- 🔒 Origin validation for secure cross-window communication
- 📱 Responsive UI with session and signature approval flows

## Embedding in Your Application

FaceSign Enclave can be embedded in your application using an iframe. See [EMBEDDING.md](./EMBEDDING.md) for detailed integration instructions.

### Quick Example

```html
<iframe 
  id="facesign-enclave"
  src="https://facesign-enclave.idos.network" 
  sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation"
  style="width: 450px; height: 600px;">
</iframe>

<script>
  const iframe = document.getElementById('facesign-enclave');
  
  // Wait for ready message
  window.addEventListener('message', (event) => {
    if (event.data.type === 'facesign_ready') {
      // Request session
      iframe.contentWindow.postMessage({
        type: 'session_proposal',
        data: {
          id: 1,
          metadata: {
            name: 'My App',
            description: 'Request access to signing key'
          }
        }
      }, '*');
    }
  });
</script>
```

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm/pnpm/yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `https://localhost:5173` (HTTPS enabled via mkcert).

### Environment Variables

Create a `.env.local` file with:

```bash
# Service URLs
VITE_FACESIGN_SERVICE_URL=https://facesign.staging.sandbox.fractal.id/
VITE_ENTROPY_SERVICE_URL=https://entropy.staging.sandbox.fractal.id/

# FaceTec configuration
VITE_FACETEC_DEVICE_KEY_IDENTIFIER="your-device-key"
VITE_FACETEC_PRODUCTION_KEY='{"domains": "...", "expiryDate": "...", "key": "..."}'

# Allowed parent origins for iframe embedding (comma-separated)
# Use "*" for development, specific origins for production
VITE_ALLOWED_ORIGINS="*"
```

### Testing the Iframe Embedding

A test page is provided for manual testing:

```bash
# Start the dev server
npm run dev

# Open test/iframe-test.html in your browser
# It will load the enclave from localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
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
- **React Router**: Page routing (login, session, sign, wallet)
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling
- **NaCl (tweetnacl)**: Cryptographic signing
- **BIP39**: Mnemonic generation

## License

MIT - See [LICENSE](./LICENSE) for details

## Support

For issues or questions, please visit: https://github.com/idos-network/idos-sdk-js
