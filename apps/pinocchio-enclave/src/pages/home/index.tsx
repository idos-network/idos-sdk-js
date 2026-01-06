import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import testImage from "@/assets/pin.png";
import { useKeyStorageContext } from "@/contexts/key";
import { Heading } from "../../components/heading";
import { Paragraph } from "../../components/paragraph";

export default function Home() {
  const { isKeyAvailable } = useKeyStorageContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isKeyAvailable) {
      navigate("/wallet");
    }
  }, []);

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
              Welcome to idOS Pinocchio Enclave
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Get started by performing face verification to unlock your secure enclave.
            </Paragraph>
          </div>

          {/* Main Image */}
          <div className="flex justify-center">
            <img src={testImage} alt="Main" className="max-w-1/2 h-auto rounded-lg shadow-lg" />
          </div>

          <div className="mt-12 pt-8">
            <div className="flex gap-4 justify-center">
              <NavLink
                type="button"
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors text-primary-foreground"
                to="/login"
              >
                Face login
              </NavLink>
            </div>
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
