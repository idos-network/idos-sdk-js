import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useFetchCredentialDetails } from "@/lib/queries/credentials";
import { safeParse } from "./shared";

interface CredentialDetailsProps {
  isOpen: boolean;
  credentialId: string;
  onClose: () => void;
}

export function CredentialDetails({ isOpen, credentialId, onClose }: CredentialDetailsProps) {
  const credential = useFetchCredentialDetails({
    credentialId,
  });

  const jsonLink = `data:text/json;chatset=utf-8,${encodeURIComponent(
    JSON.stringify(credential.data),
  )}`;

  const credentialContent = credential.data?.content
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(credential.data.content), null, 2);
        } catch (_e) {
          return credential.data.content;
        }
      })()
    : "No content to display";

  const meta = safeParse<{ type?: string; issuer?: string }>(credential.data?.public_notes);

  const downloadFileName = credential.data?.public_notes
    ? `${meta.type || "credential"}_${meta.issuer || "unknown"}.json`
    : "credential.json";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credential details</DialogTitle>
        </DialogHeader>
        <div className="flex max-w-full overflow-auto">
          {credential.isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : null}

          {credential.isError ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-red-500">Unable to fetch credential details.</p>
              <p className="text-red-500">{credential.error.message}</p>
            </div>
          ) : null}

          {credential.isSuccess ? <Code id="credential-details">{credentialContent}</Code> : null}
        </div>
        <DialogFooter className="gap-2.5">
          {credential.isError ? <Button onClick={() => credential.refetch()}>Retry</Button> : null}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {credential.isSuccess ? (
            <Button
              id={`download-credential-${credential.data?.id}`}
              variant="default"
              onClick={() => {
                const a = document.createElement("a");
                a.href = jsonLink;
                a.download = downloadFileName;
                a.click();
              }}
            >
              <DownloadIcon size={24} />
              Download as .json
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
