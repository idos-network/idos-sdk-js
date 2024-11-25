"use client";

import Loader from "@/app/components/Loader";
import { fetchSumSubToken } from "@/app/lib/api";
import { useCurrent } from "@/app/lib/current";
import { usePolling } from "@/app/lib/hooks";
import SumsubWebSdk from "@sumsub/websdk-react";
import { useEffect, useState } from "react";

export default function KYC() {
  const [token, setToken] = useState<string | null>(null);
  const {
    update,
    current: { user },
  } = useCurrent();
  const [startPolling, stopPolling, isPolling] = usePolling();

  useEffect(() => {
    if (isPolling) return;

    startPolling({
      interval: 2000,
      timeout: 5 * 60e3,
      poll: () => void update(),
    });

    // When unmount we need to stop polling
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (user?.sumSubStatus === "approved" && isPolling) {
      stopPolling();
    }
  }, [user, isPolling, stopPolling]);

  // Fetch & set token
  const fetchAndSetToken = () => {
    return fetchSumSubToken().then((token) => {
      setToken(token);
      return token;
    });
  };

  useEffect(() => void fetchAndSetToken(), []);

  if (!token) return <Loader />;

  return <SumsubWebSdk accessToken={token} expirationHandler={fetchAndSetToken} />;
}
