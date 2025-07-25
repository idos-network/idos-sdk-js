"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

function HifiCallbackContent() {
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

  return <div>Processing callback...</div>;
}

export default function HifiTosCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HifiCallbackContent />
    </Suspense>
  );
}
