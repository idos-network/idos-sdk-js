console.log("🚀 idOS content script loaded");

// Simple port-based communication
let port: chrome.runtime.Port | null = null;

function connectToBackground() {
  port = chrome.runtime.connect({ name: "idos-connection" });

  port.onMessage.addListener((message) => {
    console.log("📨 Content script received:", message);

    // Forward response to injected script
    window.postMessage(
      {
        type: "IDOS_RESPONSE",
        data: message,
      },
      "*",
    );
  });

  port.onDisconnect.addListener(() => {
    console.log("🔗 Port disconnected");
    port = null;
    // Try to reconnect after a delay
    setTimeout(connectToBackground, 1000);
  });
}

// Connect to background script
connectToBackground();

function exposeIdOSAPI() {
  try {
    // Create a script element to inject into the page context
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/injected-script.js");
    script.onload = () => {
      script.remove(); // Clean up the script element
    };

    // Inject the script into the page
    (document.head || document.documentElement).appendChild(script);

    console.log("🔑 idOS API injected into page", script);
  } catch (error) {
    console.error("🔑 Error injecting idOS API:", error);
  }
}

// Expose the idOS API to the page in window context
exposeIdOSAPI();

// Simple message handler for injected script
window.addEventListener("message", (event) => {
  if (!port) {
    console.error("🚨 No port connection available");
    return;
  }

  const { type, data } = event.data;

  if (type === "IDOS_REQUEST") {
    console.log("📨 Forwarding request to background:", data);
    port.postMessage({
      id: data.requestId,
      type: data.action,
      params: data.params,
    });
  }
});

console.log("🔑 idOS content script ready");
