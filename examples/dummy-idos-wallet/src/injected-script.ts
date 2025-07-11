function injectIdOS(global: any) {

  // Create the idOS API in the page's window context
  global.idOS = {
    pendingRequests: new Map(),
  };

  // Helper function to send requests
  function sendRequest(action: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      // Store the promise resolvers
      global.idOS.pendingRequests.set(requestId, { resolve, reject });

      // Send message to content script
      global.postMessage({
        type: "IDOS_REQUEST",
        data: {
          requestId,
          action,
          params: {
            ...params,
            origin: window.location.origin,
            url: window.location.href,
          }
        }
      }, "*");

      // Set a timeout for the request
      setTimeout(() => {
        if (global.idOS.pendingRequests.has(requestId)) {
          global.idOS.pendingRequests.delete(requestId);
          reject(new Error("Request timed out"));
        }
      }, 30000); // 30 second timeout
    });
  }

  // @ts-expect-error - getAllCredentials is not defined
  global.idOS.getAllCredentials = async () => {
    console.log("🚀 getAllCredentials called");
    return sendRequest('getAllCredentials');
  };

  // @ts-expect-error - getCredentialContent is not defined
  global.idOS.getCredentialContent = async (id: string) => {
    console.log("🚀 getCredentialContent called", id);
    return sendRequest('getCredentialContent', { id });
  };

  // @ts-expect-error - showCredentialsPopup is not defined
  global.idOS.showCredentialsPopup = async (level: string) => {
    console.log("🚀 showCredentialsPopup called with level:", level);
    return sendRequest('showCredentialsPopup', { level });
  };

  console.log("🔑 idOS API created:", global.idOS);

  // Handle responses from content script
  window.addEventListener("message", (event) => {
    if (event.data.type === "IDOS_RESPONSE") {
      const { id, result, error } = event.data.data;
      console.log("🔑 Processing response for requestId:", id);

      // @ts-expect-error - pendingRequests is not defined
      if (window.idOS?.pendingRequests?.has(id)) {
      // @ts-expect-error - pendingRequests is not defined
        const pendingRequest = window.idOS.pendingRequests.get(id);
        if (pendingRequest) {
          const { resolve, reject } = pendingRequest;
          // @ts-expect-error - pendingRequests is not defined
          window.idOS.pendingRequests.delete(id);

          if (error) {
            console.log("🔑 Rejecting request with error:", error);
            reject(new Error(error));
          } else {
            console.log("🔑 Resolving request with result:", result);
            resolve(result);
          }
        }
      }
    }
  });

  console.log("🔑 idOS API exposed to page");
}

console.log("🚀 idOS API injection script running");
setTimeout(() => injectIdOS(window), 1000);
