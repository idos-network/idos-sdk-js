import { useState } from "react";
import { useKeyStorageContext } from "@/contexts/key";
import { useRequests } from "@/contexts/requests";
import { Heading } from "../../components/heading";
import { Paragraph } from "../../components/paragraph";

export default function Session() {
  const { sessionProposals } = useRequests();
  const { getPublicKey } = useKeyStorageContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const firstProposal = sessionProposals[0];

  const handleApprove = async () => {
    if (!firstProposal || isProcessing) return;
    setIsProcessing(true);
    try {
      firstProposal.callback(true, await getPublicKey());
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!firstProposal || isProcessing) return;
    setIsProcessing(true);
    try {
      firstProposal.callback(false);
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
              Session Approval
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Please review the session proposal details below and choose to approve or reject the
              request.
            </Paragraph>
          </div>

          {/* Proposal Details */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Application</h3>
              <p className="text-white">{firstProposal.metadata.name}</p>
              <p className="text-sm text-gray-400">{firstProposal.metadata.description}</p>
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
              className="px-8 py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isProcessing ? "Processing..." : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
