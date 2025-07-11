/**
 * Generates a random code verifier for PKCE
 * @param length - Length of the code verifier (default: 128)
 * @returns Base64URL encoded code verifier
 */
function generateCodeVerifier(length = 128) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generates a code challenge from a code verifier using SHA256
 * @param codeVerifier - The code verifier to hash
 * @returns Base64URL encoded code challenge
 */
export async function generateCodeChallenge() {
  const codeVerifier = generateCodeVerifier();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return {
    codeVerifier,
    codeChallenge: base64URLEncode(new Uint8Array(digest))
  }
}

/**
 * Encodes a Uint8Array to Base64URL format
 * @param buffer - The buffer to encode
 * @returns Base64URL encoded string
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}