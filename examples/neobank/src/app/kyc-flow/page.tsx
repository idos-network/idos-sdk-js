"use client";
import dynamic from "next/dynamic";

// @todo: since we fixed the _not_found page. should we keep this?
const KycFlowClient = dynamic(() => import("./kyc-flow"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
        <p className="mt-4">Loading KYC Flow...</p>
      </div>
    </div>
  ),
});

export default function KycFlowPage() {
  return <KycFlowClient />;
}
