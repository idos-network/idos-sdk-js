function injectIdOS(global) {
  // Create the idOS API in the page's window context
  global.idOS = {
    pendingRequests: new Map(),
  };

  // Helper function to send requests
  function sendRequest(action, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      // Store the promise resolvers
      global.idOS.pendingRequests.set(requestId, { resolve, reject });

      // Send message to content script
      global.postMessage(
        {
          type: "IDOS_REQUEST",
          data: {
            requestId,
            action,
            params: {
              ...params,
              origin: window.location.origin,
              url: window.location.href,
            },
          },
        },
        "*",
      );

      // Set a timeout for the request
      setTimeout(() => {
        if (global.idOS.pendingRequests.has(requestId)) {
          global.idOS.pendingRequests.delete(requestId);
          reject(new Error("Request timed out"));
        }
      }, 120000); // 2 minutes timeout
    });
  }

  global.idOS.getAllCredentials = async () => {
    console.log("🚀 getAllCredentials called");
    return sendRequest("getAllCredentials");
  };

  global.idOS.getCredentialContent = async (id) => {
    console.log("🚀 getCredentialContent called", id);
    return sendRequest("getCredentialContent", { id });
  };

  global.idOS.showCredentialsPopup = async (level) => {
    console.log("🚀 showCredentialsPopup called with level:", level);
    return sendRequest("showCredentialsPopup", { level });
  };

  global.idOS.confirm = async (message) => {
    console.log("🚀 confirm called with message:", message);
    return sendRequest("confirm", { message });
  };

  console.log("🔑 idOS API created:", global.idOS);

  // Handle responses from content script
  window.addEventListener("message", (event) => {
    if (event.data.type === "IDOS_RESPONSE") {
      const { id, result, error } = event.data.data;
      console.log("🔑 Processing response for requestId:", id);

      if (window.idOS?.pendingRequests?.has(id)) {
        const pendingRequest = window.idOS.pendingRequests.get(id);
        if (pendingRequest) {
          const { resolve, reject } = pendingRequest;
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

if (!chrome.runtime.id) {
  // Not in a chrome extension content script
  console.log("🚀 idOS API injection script running");
  requestAnimationFrame(() => {
    injectIdOS(window);
  });
}
