// Read only when the enclave runs on localhost (see config.ts). Deployed builds ignore these
// variables and take their service URLs and allowed origins from config.ts.
export const env = {
  VITE_FACESIGN_SERVICE_URL: import.meta.env.VITE_FACESIGN_SERVICE_URL as string | undefined,
  VITE_ENTROPY_SERVICE_URL: import.meta.env.VITE_ENTROPY_SERVICE_URL as string | undefined,
  VITE_FACETEC_DEVICE_KEY_IDENTIFIER: import.meta.env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER as
    | string
    | undefined,
  VITE_FACETEC_IFRAME_FEATURE_FLAG: import.meta.env.VITE_FACETEC_IFRAME_FEATURE_FLAG as
    | string
    | undefined,
  VITE_ALLOWED_ORIGINS: import.meta.env.VITE_ALLOWED_ORIGINS as string | undefined,
};
