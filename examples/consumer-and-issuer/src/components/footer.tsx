import { CommandIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-neutral-950 pt-12">
      <div className="container mx-auto">
        <div className="mx-6 p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <div className="mb-4 flex items-center justify-center md:justify-start">
                <CommandIcon className="h-6 w-6 text-gray-400" />
                <span className="ml-2 font-semibold text-gray-100 text-xl">NeoBank</span>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionizing banking with cutting-edge technology and premium services.
              </p>
            </div>
            <div className="text-center md:text-right">
              <h3 className="mb-4 font-semibold text-gray-100">Contact & Hours</h3>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">1-800-ACME-BANK</p>
                <p className="text-gray-400 text-sm">support@acmebank.com</p>
                <p className="text-gray-400 text-sm">123 Finance Street, NY 10001</p>
                <p className="mt-4 text-gray-400 text-sm">24/7 Customer Support</p>
                <p className="text-gray-400 text-sm">Mon-Fri: 9am-6pm EST</p>
                <p className="text-gray-400 text-sm">Sat-Sun: 10am-4pm EST</p>
              </div>
            </div>
          </div>
          <div className="mt-12 border-gray-900 border-t pt-8">
            <p className="text-center text-gray-500 text-sm">
              © 2024 NeoBank. All rights reserved. Member FDIC.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
