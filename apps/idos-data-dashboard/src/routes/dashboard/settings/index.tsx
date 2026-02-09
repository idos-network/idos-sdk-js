import { FileLockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdOS } from "@/idOS.provider";

export function Component() {
  const idOSClient = useIdOS();

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-neutral-900 p-5 lg:h-20">
        <h1 className="block font-bold! text-2xl! lg:text-3xl!">Settings</h1>
      </div>
      <div className="flex flex-col items-stretch gap-2.5">
        <h2 className="block font-bold! text-lg!">Back up your password or secret key</h2>
        <div className="rounded-xl bg-neutral-900 p-5">
          <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
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
