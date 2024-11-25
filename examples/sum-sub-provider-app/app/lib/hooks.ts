import { useState } from "react";

interface PollingOpts {
  interval: number;
  timeout?: number;
  poll: () => void;
  onTimeout?: () => void;
}
export const usePolling = (): [(opts: PollingOpts) => void, () => void, boolean] => {
  const [pollingTimeout, setPollingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const stop = () => {
    if (pollingTimeout !== null) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const start = ({ interval, timeout, poll, onTimeout }: PollingOpts) => {
    if (timeout) {
      setPollingTimeout(
        setTimeout(() => {
          if (onTimeout) {
            onTimeout();
          }
          stop();
        }, timeout),
      );
    }

    setPollingInterval(
      setInterval(() => {
        poll();
      }, interval),
    );
  };

  return [start, stop, pollingTimeout !== null || pollingInterval !== null];
};
