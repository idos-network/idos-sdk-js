"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { PaymentMethod } from "~/lib/types/noah";
import type { Country } from "~/lib/types/shared";

type CheckoutState = {
  country: Country | undefined;
  token: string;
  withdrawAmount: number;
  recipientAddress: string | undefined;
  paymentMethod: PaymentMethod | undefined;
  transferType: "bank" | "wallet" | "";
  formData: Record<string, any> | undefined;
  channelId: string | undefined;
  fiatAmount: number;
  setFiatAmount: (amount: number) => void;
  setCountry: (country: Country) => void;
  setToken: (token: string) => void;
  setWithdrawAmount: (amount: number) => void;
  setRecipientAddress: (address: string | undefined) => void;
  setPaymentMethod: (paymentMethod: PaymentMethod | undefined) => void;
  setTransferType: (transferType: "bank" | "wallet" | "") => void;
  setFormData: (data: Record<string, any>) => void;
  setChannelId: (id: string) => void;
};

const CheckoutContext = createContext<CheckoutState | undefined>(undefined);

type CheckoutProviderProps = {
  children: ReactNode;
};

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const [country, setCountry] = useState<Country | undefined>(undefined);
  const [token, setToken] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [fiatAmount, setFiatAmount] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [transferType, setTransferType] = useState<"bank" | "wallet" | "">("");
  const [formData, setFormData] = useState<Record<string, any> | undefined>(undefined);
  const [channelId, setChannelId] = useState<string | undefined>(undefined);

  return (
    <CheckoutContext.Provider
      value={{
        country,
        token,
        withdrawAmount,
        recipientAddress,
        paymentMethod,
        transferType,
        formData,
        channelId,
        fiatAmount,
        setFiatAmount,
        setCountry,
        setToken,
        setWithdrawAmount,
        setRecipientAddress,
        setPaymentMethod,
        setTransferType,
        setFormData,
        setChannelId,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
