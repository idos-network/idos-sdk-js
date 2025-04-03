import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-neutral-950">
      <div className="container mx-auto px-6">
        <div className="py-6 md:py-14">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="text-center md:text-left">
              <div className="mb-4 flex items-center justify-center md:justify-start">
                <Image src="/static/logo.svg" alt="NeoBank" width={40} height={40} />
                <span className="ml-2 font-semibold text-gray-100 text-xl">NeoBank</span>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionizing banking with cutting-edge technology and premium services.
              </p>
            </div>
            <div className="text-center md:text-right">
              <h3 className="mb-4 font-semibold text-gray-100">Contact & Hours</h3>
              <div className="flex flex-col gap-2">
                <p className="text-gray-400 text-sm">1-800-NEO-BANK</p>
                <p className="text-gray-400 text-sm">support@neobank.com</p>
                <p className="text-gray-400 text-sm">123 Finance Street, NY 10001</p>
                <p className="mt-4 text-gray-400 text-sm">24/7 Customer Support</p>
                <p className="text-gray-400 text-sm">Mon-Fri: 9am-6pm EST</p>
                <p className="text-gray-400 text-sm">Sat-Sun: 10am-4pm EST</p>
              </div>
            </div>
          </div>
          <div className="mt-6 border-gray-900 border-t pt-8">
            <p className="text-center text-gray-500 text-sm">
              © 2025 NeoBank. All rights reserved. Member FDIC.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
