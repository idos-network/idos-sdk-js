import { signal } from "@preact/signals";
import { createContext } from "preact";
import { useContext } from "preact/hooks";

type EventType = "enclave:load";

const allowedEvents: EventType[] = ["enclave:load"];

export function createMessageListener() {
  const messagePort = signal<MessagePort>();

  window.addEventListener("message", (event) => {
    if (!allowedEvents.includes(event.data.type)) return;

    messagePort.value = event.ports[0];
  });

  return {
    postMessage(message: unknown) {
      messagePort.value?.postMessage(message);
      messagePort.value?.close();
    },
  };
}

export const MessageListenerContext = createContext<ReturnType<typeof createMessageListener>>(
  // biome-ignore lint/style/noNonNullAssertion: This is fine.
  null!,
);

export const useMessageChannel = () => useContext(MessageListenerContext);
