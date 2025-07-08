"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { BridgeIcon, BuyIcon, ReceiveIcon, SellIcon, SendIcon, SwapIcon } from "./icons";

interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const actionButtons: ActionButton[] = [
  {
    id: "buy",
    label: "Buy",
    icon: <BuyIcon />,
    isActive: true,
  },
  {
    id: "sell",
    label: "Sell",
    icon: <SellIcon />,
  },
  {
    id: "swap",
    label: "Swap",
    icon: <SwapIcon />,
  },
  {
    id: "bridge",
    label: "Bridge",
    icon: <BridgeIcon />,
  },
  {
    id: "send",
    label: "Send",
    icon: <SendIcon />,
  },
  {
    id: "receive",
    label: "Receive",
    icon: <ReceiveIcon />,
  },
];

export default function ActionToolbar() {
  const handleActionClick = (actionId: string) => {
    console.log(`${actionId} clicked`);
    // Add your action handlers here
  };

  return (
    <div className="">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          {actionButtons.map((action) => (
            <div key={action.id} className="flex w-14 flex-col items-center gap-3">
              {/* Action Button */}
              <Button
                onClick={() => handleActionClick(action.id)}
                className={`h-13 w-13 rounded-full p-0 transition-all duration-200 hover:scale-105 ${
                  action.isActive
                    ? "bg-green-400 text-black hover:bg-green-500"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
                variant="ghost"
              >
                {action.icon}
              </Button>

              {/* Action Label */}
              <span className="font-medium text-sm text-white">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
