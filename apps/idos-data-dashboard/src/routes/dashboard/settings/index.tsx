import { FileLockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdOS } from "@/idOS.provider";

export function Component() {
  const idOSClient = useIdOS();

  return (
    <div className="flex flex-col items-stretch gap-5 flex-1">
      <div className="flex items-center justify-between h-14 lg:h-20 p-5 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl! lg:text-3xl! font-bold!">Settings</h1>
      </div>
      <div className="flex flex-col items-stretch gap-2.5">
        <h2 className="block text-lg! font-bold!">Back up your password or secret key</h2>
        <div className="p-5 bg-neutral-900 rounded-xl">
          <div className="flex items-stretch md:items-center justify-between gap-5 flex-col md:flex-row">
            <p>Create a backup of your idOS password or secret key</p>
            <Button
              variant="default"
              onClick={async () => {
                if (idOSClient.state !== "logged-in") throw new Error("User not authenticated");

                await idOSClient.enclaveProvider.backupUserEncryptionProfile();
              }}
            >
              <FileLockIcon size={20} />
              <span>Back up your idOS key</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Component.displayName = "Settings";
