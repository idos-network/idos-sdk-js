import { create } from "zustand";
import { currencies, tokens } from "@/components/token-amount-input";

export const useBuyStore = create<{
  spendAmount: string;
  buyAmount: string;
  setSpendAmount: (spendAmount: string) => void;
  setBuyAmount: (buyAmount: string) => void;
  rate: string;
  setRate: (rate: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (selectedCurrency: string) => void;
  selectedToken: string;
  setSelectedToken: (selectedToken: string) => void;
  lastChanged: "spend" | "buy";
  setLastChanged: (field: "spend" | "buy") => void;
}>((set) => ({
  spendAmount: "",
  buyAmount: "",
  setBuyAmount: (buyAmount) => {
    const rate = useBuyStore.getState().rate || 1;
    const spendAmount = +buyAmount / +rate;
    set({ buyAmount, spendAmount: spendAmount.toString(), lastChanged: "buy" });
  },
  setSpendAmount: (spendAmount) => {
    const rate = useBuyStore.getState().rate || 1;
    const buyAmount = +spendAmount * +rate;
    set({ spendAmount, buyAmount: buyAmount.toString(), lastChanged: "spend" });
  },
  rate: "",
  setRate: (rate: string) => {
    const { spendAmount, buyAmount, lastChanged } = useBuyStore.getState();
    let newSpendAmount = spendAmount;
    let newBuyAmount = buyAmount;
    if (lastChanged === "spend") {
      newBuyAmount = (+spendAmount * +rate).toString();
    } else if (lastChanged === "buy") {
      newSpendAmount = (+buyAmount / +rate).toString();
    }
    set({ rate, spendAmount: newSpendAmount, buyAmount: newBuyAmount });
  },
  selectedCurrency: currencies[0].value,
  setSelectedCurrency: (selectedCurrency) => set({ selectedCurrency }),
  selectedToken: tokens[0].value,
  setSelectedToken: (selectedToken) => set({ selectedToken }),
  lastChanged: "spend",
  setLastChanged: (field) => set({ lastChanged: field }),
}));
