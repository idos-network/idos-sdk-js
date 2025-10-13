import { NavLink } from "react-router";
import Logo from "@/assets/idos-logo.svg?url";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <Heading
              as="h1"
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              Welcome to idOS FaceSign Enclave
            </Heading>
            <Paragraph className="text-lg text-gray-300">
              Your decentralized identity and data management platform
            </Paragraph>
            <img
              src={Logo}
              alt="idOS FaceSign Enclave"
              loading="eager"
              width={114}
              height={37}
              className="m-auto"
            />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-3">🔐</div>
              <Heading as="h3" className="text-xl mb-2">
                Secure Storage
              </Heading>
              <Paragraph className="text-gray-400">
                Store your identity data securely with end-to-end encryption
              </Paragraph>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="text-3xl mb-3">🌐</div>
              <Heading as="h3" className="text-xl mb-2">
                Decentralized
              </Heading>
              <Paragraph className="text-gray-400">
                Own your data without relying on centralized authorities
              </Paragraph>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700 hover:border-green-500 transition-colors">
              <div className="text-3xl mb-3">⚡</div>
              <Heading as="h3" className="text-xl mb-2">
                Easy Access
              </Heading>
              <Paragraph className="text-gray-400">
                Access your identity seamlessly across multiple platforms
              </Paragraph>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <Paragraph className="text-gray-400 mb-4">
              Get started by performing face verification to unlock your secure enclave.
            </Paragraph>
            <div className="flex gap-4 justify-center">
              <NavLink
                type="button"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                to="/login"
              >
                Start
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
