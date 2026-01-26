# Embedding Pinocchio Enclave via Iframe

This guide explains how to embed the Pinocchio Enclave application in your 3rd party application using an iframe.

## Overview

Pinocchio Enclave is a secure signing application that can be embedded in your application to provide cryptographic signing capabilities. It uses postMessage API for secure communication between the parent application and the enclave iframe.

## Quick Start

### 1. Embed the Iframe

Add the following HTML to your application:

```html
<iframe 
  id="pinocchio-enclave"
  src="https://enclave.idos.network" 
  sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation"
  style="width: 450px; height: 600px; border: 1px solid #ccc; border-radius: 8px;">
</iframe>
```

### 2. Wait for the Enclave to be Ready

The enclave will send a `pinocchio_ready` message when it's initialized:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'pinocchio_ready') {
    console.log('Pinocchio Enclave is ready');
    // You can now send requests to the enclave
  }
});
```

### 3. Send Session Proposal

Request the user to approve a session and receive their public key:

```javascript
const iframe = document.getElementById('pinocchio-enclave');

iframe.contentWindow.postMessage({
  type: 'session_proposal',
  data: {
    id: 1, // Unique ID for this proposal
    metadata: {
      name: 'My Application',
      description: 'Request access to your signing key'
    }
  }
}, 'https://enclave.idos.network');
```

### 4. Handle the Response

Listen for the session approval response:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'session_proposal_response') {
    const { id, approved, address } = event.data.data;
    
    if (approved) {
      console.log('Session approved! Public key:', address);
      // Store the public key for future use
    } else {
      console.log('Session rejected by user');
    }
  }
});
```

### 5. Request Signature

Once the session is approved, request signatures:

```javascript
const dataToSign = new TextEncoder().encode('Hello, World!');

iframe.contentWindow.postMessage({
  type: 'sign_proposal',
  data: {
    id: 2, // Unique ID for this proposal
    data: Array.from(dataToSign), // Must be array of bytes
    metadata: {
      name: 'My Application',
      description: 'Sign transaction XYZ'
    }
  }
}, 'https://enclave.idos.network');
```

### 6. Handle Signature Response

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'sign_proposal_response') {
    const { id, signature } = event.data.data;
    
    if (signature) {
      console.log('Signature received:', signature);
      // Use the signature
    } else {
      console.log('Signature request rejected by user');
    }
  }
});
```

## Complete Example

Here's a complete working example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pinocchio Enclave Integration Example</title>
</head>
<body>
  <h1>Pinocchio Enclave Integration</h1>
  
  <iframe 
    id="pinocchio-enclave"
    src="https://enclave.idos.network" 
    sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation"
    style="width: 450px; height: 600px; border: 1px solid #ccc; border-radius: 8px;">
  </iframe>

  <div>
    <button id="request-session">Request Session</button>
    <button id="request-signature" disabled>Request Signature</button>
  </div>

  <div id="status"></div>

  <script>
    const iframe = document.getElementById('pinocchio-enclave');
    const statusDiv = document.getElementById('status');
    const requestSessionBtn = document.getElementById('request-session');
    const requestSignatureBtn = document.getElementById('request-signature');
    
    let enclaveReady = false;
    let sessionApproved = false;
    let proposalIdCounter = 0;

    // Listen for messages from the enclave
    window.addEventListener('message', (event) => {
      // Verify origin in production!
      // if (event.origin !== 'https://enclave.idos.network') return;

      const { type, data } = event.data;

      switch (type) {
        case 'pinocchio_ready':
          enclaveReady = true;
          statusDiv.textContent = 'Enclave ready!';
          requestSessionBtn.disabled = false;
          break;

        case 'session_proposal_response':
          if (data.approved) {
            sessionApproved = true;
            statusDiv.textContent = `Session approved! Public key: ${data.address}`;
            requestSignatureBtn.disabled = false;
          } else {
            statusDiv.textContent = 'Session rejected by user';
          }
          break;

        case 'sign_proposal_response':
          if (data.signature) {
            statusDiv.textContent = `Signature received: ${data.signature}`;
          } else {
            statusDiv.textContent = 'Signature request rejected';
          }
          break;
      }
    });

    // Request session
    requestSessionBtn.addEventListener('click', () => {
      if (!enclaveReady) {
        alert('Enclave not ready yet');
        return;
      }

      iframe.contentWindow.postMessage({
        type: 'session_proposal',
        data: {
          id: ++proposalIdCounter,
          metadata: {
            name: 'Example App',
            description: 'Request access to your signing key'
          }
        }
      }, '*'); // Use specific origin in production
    });

    // Request signature
    requestSignatureBtn.addEventListener('click', () => {
      if (!sessionApproved) {
        alert('Session not approved yet');
        return;
      }

      const dataToSign = new TextEncoder().encode('Hello from Example App!');
      
      iframe.contentWindow.postMessage({
        type: 'sign_proposal',
        data: {
          id: ++proposalIdCounter,
          data: Array.from(dataToSign),
          metadata: {
            name: 'Example App',
            description: 'Sign example message'
          }
        }
      }, '*'); // Use specific origin in production
    });
  </script>
</body>
</html>
```

## Security Considerations

### Origin Validation

**IMPORTANT**: In production, always validate the origin of messages:

```javascript
window.addEventListener('message', (event) => {
  // Only accept messages from the enclave
  if (event.origin !== 'https://enclave.idos.network') {
    return;
  }
  
  // Process the message
});
```

### Iframe Sandbox

The `sandbox` attribute restricts what the iframe can do. The minimum required permissions are:
- `allow-scripts`: Allow JavaScript execution
- `allow-same-origin`: Allow access to storage (IndexedDB for encrypted keys)
- `allow-storage-access-by-user-activation`: Allow storage access after user interaction

**Do not add** `allow-top-navigation` or `allow-popups` unless specifically needed.

### Content Security Policy

Ensure your application's CSP allows iframe embedding:

```
Content-Security-Policy: frame-src https://enclave.idos.network;
```

### HTTPS Only

Always use HTTPS in production for both your application and the enclave URL.

## Message Types

### Sent to Enclave

#### `session_proposal`
Request user approval for a session and receive their public key.

```typescript
{
  type: 'session_proposal',
  data: {
    id: number,          // Unique identifier for this proposal
    metadata: {
      name: string,      // Your application name
      description: string // Description of the request
    }
  }
}
```

#### `sign_proposal`
Request the user to sign data.

```typescript
{
  type: 'sign_proposal',
  data: {
    id: number,          // Unique identifier for this proposal
    data: number[],      // Array of bytes to sign
    metadata: {
      name: string,      // Your application name
      description: string // Description of what's being signed
    }
  }
}
```

### Received from Enclave

#### `pinocchio_ready`
Sent when the enclave is initialized and ready to receive requests.

```typescript
{
  type: 'pinocchio_ready'
}
```

#### `session_proposal_response`
Response to a session proposal.

```typescript
{
  type: 'session_proposal_response',
  data: {
    id: number,          // ID of the original proposal
    approved: boolean,   // Whether the user approved
    address?: string     // Public key (hex string) if approved
  }
}
```

#### `sign_proposal_response`
Response to a signature request.

```typescript
{
  type: 'sign_proposal_response',
  data: {
    id: number,          // ID of the original proposal
    signature: Uint8Array | null // Signature if approved, null if rejected
  }
}
```

## Configuration

### Enclave Configuration

The enclave accepts the following environment variables:

- `VITE_ALLOWED_ORIGINS`: Comma-separated list of allowed parent origins (default: `*` for development)

For production deployments, configure allowed origins:

```bash
VITE_ALLOWED_ORIGINS="https://app1.example.com,https://app2.example.com"
```

## Troubleshooting

### Enclave doesn't load

1. Check browser console for CSP or CORS errors
2. Verify the iframe `src` URL is correct
3. Ensure your CSP allows iframe embedding from the enclave origin

### Messages not being received

1. Verify you're using the correct target origin in `postMessage`
2. Check that the enclave has sent the `pinocchio_ready` message
3. Ensure origin validation isn't blocking legitimate messages

### Storage errors

1. The iframe needs `allow-same-origin` and `allow-storage-access-by-user-activation` sandbox permissions
2. Ensure cookies/storage aren't blocked in the browser

## Support

For issues or questions, please visit: https://github.com/idos-network/idos-sdk-js
