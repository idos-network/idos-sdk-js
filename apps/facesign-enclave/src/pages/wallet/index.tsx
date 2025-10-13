import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { copyToClipboard, deriveWallets, type WalletAddress } from "@/lib/wallets";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";

export default function Wallet() {
  const entropy = storage.get("entropy");
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallets() {
      if (entropy) {
        try {
          const derivedWallets = await deriveWallets(entropy);
          setWallets(derivedWallets);
        } catch (error) {
          console.error("Failed to derive wallets:", error);
        }
      }
      setLoading(false);
    }
    loadWallets();
  }, [entropy]);

  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

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
              Your Wallets
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Multi-chain wallet addresses derived from your seed phrase
            </Paragraph>
          </div>

          {/* Entropy Display (Collapsible) */}
          <details className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              View Seed Phrase
            </summary>
            <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700">
              <Paragraph className="text-xs text-gray-300 break-all font-mono">
                {entropy || "Not available"}
              </Paragraph>
            </div>
          </details>

          {/* Wallets Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Paragraph className="text-gray-400">Loading wallets...</Paragraph>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12">
              <Paragraph className="text-gray-400">No seed phrase available</Paragraph>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((wallet) => (
                <div
                  key={wallet.symbol}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  {/* Chain Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                        {wallet.icon}
                      </div>
                      <div>
                        <Heading as="h3" className="text-lg font-semibold">
                          {wallet.chain}
                        </Heading>
                        <Paragraph className="text-xs text-gray-400">{wallet.symbol}</Paragraph>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Paragraph className="text-xs text-gray-400">Address</Paragraph>
                    <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-700">
                      <code className="text-xs text-gray-200 break-all block">
                        {wallet.address}
                      </code>
                    </div>
                  </div>

                  {/* Derivation Path */}
                  <div className="mt-3 space-y-1">
                    <Paragraph className="text-xs text-gray-500">
                      Path: <code className="text-gray-400">{wallet.derivationPath}</code>
                    </Paragraph>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(wallet.address)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    {copiedAddress === wallet.address ? "✓ Copied!" : "Copy Address"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Warning Notice */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <Paragraph className="text-sm text-yellow-200">
              <strong>⚠️ Important:</strong> Bitcoin addresses use proper BIP44 derivation and are
              cryptographically valid. Ethereum/EVM and other chain addresses use simplified hashing
              and should be verified with proper libraries (like @noble/hashes) before production
              use.
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
