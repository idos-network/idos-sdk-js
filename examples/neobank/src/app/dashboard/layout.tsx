import Image from "next/image";
import type React from "react";
import ActionToolbar from "@/components/action-toolbar";
import BalanceComponent from "@/components/balance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-black px-5 py-12">
      <div className="mb-[104px] place-items-center">
        <Image src="/logo-white.svg" alt="NeoBank" width={238} height={41} />
      </div>
      <div className="mx-auto flex w-full max-w-[1022px] flex-col gap-12">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-center">
          <BalanceComponent />
          <ActionToolbar />
        </div>
        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-gray-800 border-b bg-transparent p-0">
            <TabsTrigger
              value="tokens"
              className="w-[130px] rounded-none border-transparent border-x-0 border-t-0 border-b-2 pb-4 font-medium text-gray-400 hover:text-white data-[state=active]:border-green-400 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-green-400"
            >
              Tokens
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tokens" className="mt-11">
            {children}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
