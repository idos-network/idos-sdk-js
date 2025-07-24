"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

export default function HifiTosCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setHifiSignedAgreementId } = useAppStore();

  useEffect(() => {
    const agreementId = searchParams.get("signedAgreementId");
    if (agreementId) {
      setHifiSignedAgreementId(agreementId);
      router.push("/kyc-flow");
    } else {
      console.error("No agreementId found");
    }
  }, [searchParams, router, setHifiSignedAgreementId]);

  return null;
}
