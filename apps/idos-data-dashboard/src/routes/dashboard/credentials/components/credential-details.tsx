import { base64Decode, utf8Decode } from "@idos-network/utils/codecs";
import { useQuery } from "@tanstack/react-query";
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
import { useIdOS } from "@/idOS.provider";
import { safeParse } from "../shared";

const useFetchCredentialDetails = ({ credentialId }: { credentialId: string }) => {
  const idOSClient = useIdOS();

  return useQuery({
    queryKey: ["credential_details", credentialId],
    queryFn: async ({ queryKey: [, credentialId] }) => {
      const credential = await idOSClient.getCredentialById(credentialId);

      await idOSClient.enclaveProvider.ensureUserEncryptionProfile();

      if (!credential) {
        throw new Error(`"idOSCredential" with id ${credentialId} not found`);
      }

      const decryptedContent = await idOSClient.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      );

      Object.assign(credential, { content: utf8Decode(decryptedContent) });

      return credential;
    },
    enabled: idOSClient.state === "logged-in",
  });
};

type CredentialDetailsProps = {
  isOpen: boolean;
  credentialId: string;
  onClose: () => void;
};

export const CredentialDetails = ({ isOpen, credentialId, onClose }: CredentialDetailsProps) => {
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
            <Button id={`download-credential-${credential.data?.id}`} variant="default">
              <a href={jsonLink} download={downloadFileName} className="flex items-center gap-2">
                <DownloadIcon size={24} />
                Download as .json
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
