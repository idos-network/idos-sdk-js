# idOS Passporting Server

## Overview
idOS Passporting Service provides an endpoint for inserting delegated access grants into the idOS system. This service represents Obligated Entity 1 (OE1), which originally issued a credential to a user. Another entity, Obligated Entity 2 (OE2), can use this service to request access to that credential by creating an access grant.

The service is built using the `Hono` web framework and validates incoming requests using the `Zod` validation library. It also utilizes cryptographic functions for secure key management and signature validation.

## Features
- Validates incoming requests with a structured schema.
- Authenticates requests using bearer tokens.
- Transmits Delegated Access Grant (DAG) data to idOS.
- Ensures security with key-based cryptographic operations.

## Endpoint Details
### Base URL
`http://localhost:3000`

### Endpoints
#### `GET /`
A health check endpoint to verify that the service is running.

**Response:**
```
200 OK
🚀
```

#### `POST /`
Creates a Delegated Access Grant (DAG) entry in the idOS system.

**Request Headers:**
- `Authorization`: A Bearer token for authentication. The token must be present in the configured list of valid `CLIENT_SECRETS`.

**Request Body (JSON):**
```json
{
  "dag_data_id": "UUID",
  "dag_owner_wallet_identifier": "string",
  "dag_grantee_wallet_identifier": "string",
  "dag_signature": "string",
  "dag_locked_until": "number",
  "dag_content_hash": "string"
}
```

**Request Body Parameters:**
- `dag_data_id` (string, UUID): Unique identifier for the DAG data.
- `dag_owner_wallet_identifier` (string): Wallet identifier of the owner of the DAG.
- `dag_grantee_wallet_identifier` (string): Wallet identifier of the grantee requesting access.
- `dag_signature` (string): Signature verifying the DAG payload.
- `dag_locked_until` (number): A UNIX timestamp indicating when the DAG will be unlocked.
- `dag_content_hash` (string): Hash of the DAG content to ensure integrity.

**Response:**
- **Success (200):**
```json
{
  "success": true,
  "data": {
    "dag_data_id": "UUID"
  }
}
```
- **Unauthorized (401):**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized request"
  }
}
```
- **Bad Request (400):**
```json
{
  "success": false,
  "error": {
    "cause": "string",
    "message": "string"
  }
}
```

## Code Explanation
### Initialization
The service uses the `Hono` framework for routing and `@hono/zod-validator` for schema validation.
- The `Hono` instance initializes the application (`const app = new Hono();`).
- The `env` adapter retrieves environment variables securely.

### Health Check Endpoint
The root `GET /` endpoint returns a simple rocket emoji (`🚀`) to indicate the service is running.

### Access Grant Endpoint
The `POST /` endpoint is the core functionality of the service.
1. **Validation**: The `zValidator` middleware validates the incoming JSON payload using a predefined Zod schema.
2. **Authentication**: The `Authorization` header is checked against a list of valid `CLIENT_SECRETS`.
3. **Issuer Configuration**: An issuer configuration object is created using the `createIssuerConfig` function with cryptographic keys from environment variables.
4. **DAG Creation**: The `createAccessGrantFromDAG` function transmits the validated DAG data to idOS. Errors are caught and returned with appropriate HTTP status codes.

### Security
- **Bearer Token Authentication**: The service checks the `Authorization` header to validate client requests.
- **Key Management**: Cryptographic keys for signing and encryption are securely loaded from environment variables (`ISSUER_SIGNING_SECRET_KEY`, `ISSUER_ENCRYPTION_SECRET_KEY`).

### Dependencies
- `@hono/node-server`: Provides the server environment.
- `@hono/zod-validator`: Middleware for schema validation.
- `@idos-network/codecs`: Provides encoding/decoding utilities.
- `@idos-network/issuer-sdk-js`: SDK for working with the idOS system.
- `go-try`: Utility for error handling.
- `tweetnacl`: Library for cryptographic operations.
- `zod`: Schema validation library.

### Running the Service
1. Set the following environment variables:
   - `KWIL_NODE_URL`: URL of the idOS node.
   - `ISSUER_SIGNING_SECRET_KEY`: Issuer signing secret key.
   - `ISSUER_ENCRYPTION_SECRET_KEY`: Issuer encryption secret key.
   - `CLIENT_SECRETS`: Comma-separated list of valid bearer tokens.
2. Start the service:
```bash
node index.js
```
3. Access the service at `http://localhost:3000`.

### Logs
The server logs the running status and the port:
```
Server is running on http://localhost:3000
```

```
pnpm install
pnpm run dev
```

```
open http://localhost:3000
```
