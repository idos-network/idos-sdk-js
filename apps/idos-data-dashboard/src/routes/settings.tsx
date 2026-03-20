import { DownloadIcon, FileLockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { safeParse } from "@/components/credentials/shared";
import { Button } from "@/components/ui/button";
import { useIDOSClient } from "@/hooks/idOS";

function waitForDismiss(signal: AbortSignal) {
  return new Promise<never>((_resolve, reject) => {
    document.addEventListener(
      "idos:enclave-dismissed",
      () => reject(new DOMException("Enclave dismissed", "AbortError")),
      { once: true, signal },
    );
  });
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export default function Settings() {
  const idOSClient = useIDOSClient();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBackup = async () => {
    const controller = new AbortController();
    setIsBackingUp(true);
    try {
      await Promise.race([
        idOSClient.enclaveProvider.backupUserEncryptionProfile(),
        waitForDismiss(controller.signal),
      ]);
    } catch (error) {
      const isDismissed = error instanceof DOMException && error.name === "AbortError";
      if (!isDismissed) {
        toast.error("Backup failed", {
          description: error instanceof Error ? error.message : "An unexpected error occurred",
        });
      }
    } finally {
      controller.abort();
      setIsBackingUp(false);
    }
  };

  const handleDownloadData = async () => {
    const controller = new AbortController();
    setIsDownloading(true);

    try {
      const credentials = await idOSClient.getAllCredentials();
      const originals = credentials.filter((c) => !c.original_id && !!c.public_notes);

      await Promise.race([
        idOSClient.enclaveProvider.ensureUserEncryptionProfile(),
        waitForDismiss(controller.signal),
      ]);

      const decrypted = await Promise.all(
        originals.map(async (cred) => {
          try {
            const content = await idOSClient.getCredentialContent(cred.id);
            return {
              id: cred.id,
              public_notes: safeParse(cred.public_notes),
              content: tryParseJson(content),
            };
          } catch {
            return {
              id: cred.id,
              public_notes: safeParse(cred.public_notes),
              content: null,
              error: "Failed to decrypt",
            };
          }
        }),
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        credentials: decrypted,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);

      const a = document.createElement("a");
      a.href = url;
      a.download = `idOS-data-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Data exported", {
        description: `${decrypted.length} credential${decrypted.length === 1 ? "" : "s"} exported successfully.`,
      });
    } catch (error) {
      const isDismissed = error instanceof DOMException && error.name === "AbortError";
      if (!isDismissed) {
        toast.error("Download failed", {
          description: error instanceof Error ? error.message : "An unexpected error occurred",
        });
      }
    } finally {
      controller.abort();
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Settings</h1>
      </div>
      <div className="flex flex-col items-stretch gap-5">
        <h2 className="block text-lg font-bold">Back up your password or secret key</h2>
        <div className="bg-card rounded-xl p-5">
          <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
            <p>Create a backup of your idOS password or secret key</p>
            <Button variant="default" onClick={handleBackup} isLoading={isBackingUp}>
              <FileLockIcon size={20} />
              <span>Back up your idOS key</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-5">
        <h2 className="block text-lg font-bold">Download your data</h2>
        <div className="bg-card rounded-xl p-5">
          <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
            <p>Download all your credentials and their decrypted contents as a JSON file</p>
            <Button variant="default" onClick={handleDownloadData} isLoading={isDownloading}>
              <DownloadIcon size={20} />
              <span>Download your data</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
