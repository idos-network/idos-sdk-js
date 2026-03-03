import { Outlet } from "react-router";
import { KeyStorageContextProvider } from "@/providers/key.provider";
import { RequestsContextProvider } from "@/providers/requests.provider";

export default function EnclaveLayout() {
  return (
    <KeyStorageContextProvider>
      <RequestsContextProvider>
        <Outlet />
      </RequestsContextProvider>
    </KeyStorageContextProvider>
  );
}
