import { IdosLogoRaw } from "@/icons/logo-raw";
import React from "react";

export function PoweredByIdos() {
  return (
    <div className="mt-6 flex items-center justify-center gap-1 text-[#A1A1A1] text-sm font-medium">
      <span> Powered by </span>
      <IdosLogoRaw />
      <span> idOS</span>
    </div>
  );
}
