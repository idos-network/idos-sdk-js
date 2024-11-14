import useCredentialContent from "@/queries/use-credential-content";
import useFetchCredential from "@/queries/use-fetch-credential";
import { Stack } from "@chakra-ui/react";
import {
  Button,
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "@idos-network/ui-kit";
import LoadingMsg from "./loading-msg";
import SubjectsList from "./subjects-list";

const safeParse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};

export default function CredentialDetails({
  toggle,
  credentialId,
  open,
  secretKey,
}: {
  secretKey: string;
  credentialId: string;
  open: boolean;
  toggle: (value?: boolean) => void;
}) {
  const credential = useFetchCredential(credentialId);
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const credContent = useCredentialContent(credential?.data!, secretKey);
  const parsedContent = credContent.data && safeParse(credContent.data);

  const loadingMsg = credContent.isFetching
    ? "Decrypting credential details..."
    : "Fetching Credential...";

  return (
    <DrawerRoot
      open={open && !!credentialId} // credentialId is added to make sure drawer always has credentialId once opened
      placement="end"
      size="xl"
      onOpenChange={() => {
        toggle(false);
      }}
    >
      <DrawerBackdrop />
      <DrawerContent offset={{ base: "0", md: "5" }}>
        <DrawerHeader>
          <DrawerTitle>Credential details</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Stack>
            <LoadingMsg
              loading={credential.isFetching || credContent.isFetching}
              message={loadingMsg}
            >
              {/* biome-ignore lint/style/noNonNullAssertion: <explanation> */}
              {!!parsedContent && <SubjectsList content={credContent.data!} />}
            </LoadingMsg>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <DrawerActionTrigger asChild>
            <Button variant="outline">Close</Button>
          </DrawerActionTrigger>
        </DrawerFooter>
        <DrawerCloseTrigger />
      </DrawerContent>
    </DrawerRoot>
  );
}
