import { Heading } from "../../components/heading";
import { Paragraph } from "../../components/paragraph";
import { useWallet } from "@/contexts/wallet";
import { useState } from "react";

export default function Sign() {
  const { signProposals, sign } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const firstProposal = signProposals[0];

  const handleApprove = async () => {
    if (!firstProposal || isProcessing) return;
    setIsProcessing(true);
    try {
      const signature = await sign(firstProposal.data);
      console.log("Signature:", signature);
      window.opener?.postMessage({
        type: "sign_response",
        data: {
          id: firstProposal.id,
          signature,
        },
      }, "*");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!firstProposal || isProcessing) return;
    setIsProcessing(true);
    try {
      // await rejectSession(firstProposal.id);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!firstProposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <Paragraph className="text-lg text-gray-300">No session proposals available</Paragraph>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Heading
              as="h1"
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              Sign Approval
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Please review the sign proposal details below and choose to approve or reject the request.
            </Paragraph>
          </div>

          {/* Proposal Details */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Application</h3>
              <p className="text-white">{firstProposal.metadata.name}</p>
              <p className="text-sm text-gray-400">{firstProposal.data}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={handleReject}
              disabled={isProcessing}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isProcessing ? "Processing..." : "Sign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
