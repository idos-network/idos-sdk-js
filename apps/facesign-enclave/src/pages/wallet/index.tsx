import testImage from "@/assets/pin.png";
import { Heading } from "../../components/heading";
import { Paragraph } from "../../components/paragraph";

export default function Wallet() {
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
              Your Face signer
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Waiting for connection requests...
            </Paragraph>
          </div>

          {/* Main Image */}
          <div className="flex justify-center">
            <img src={testImage} alt="Main" className="max-w-1/2 h-auto rounded-lg shadow-lg" />
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <Paragraph className="text-sm text-yellow-200">
              <strong>⚠️ Important:</strong> This is just signing application. Don't use it to store
              any funds or valuable assets.
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
