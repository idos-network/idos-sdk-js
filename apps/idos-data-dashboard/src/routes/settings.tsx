import { createFileRoute } from "@tanstack/react-router";
import { FileLockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIDOS } from "@/core/idOS";

export const Route = createFileRoute("/settings")({
  component: Settings,
  staticData: { breadcrumb: "Settings" },
});

function Settings() {
  const idOSClient = useIDOS();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await idOSClient.enclaveProvider.backupUserEncryptionProfile();
      toast.success("Backup completed successfully");
    } catch (error) {
      toast.error("Backup failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-card p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Settings</h1>
      </div>
      <div className="flex flex-col items-stretch gap-5">
        <h2 className="block font-bold text-lg">Back up your password or secret key</h2>
        <div className="rounded-xl bg-card p-5">
          <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
            <p>Create a backup of your idOS password or secret key</p>
            <Button variant="default" onClick={handleBackup} isLoading={isBackingUp}>
              <FileLockIcon size={20} />
              <span>Back up your idOS key</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
