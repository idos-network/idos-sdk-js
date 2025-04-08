import { Stack, Text } from "@chakra-ui/react";
import type { idOSCredential } from "@idos-network/core";
import { useRef, useState } from "react";

import {
  Button,
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Field,
  PasswordInput,
} from "@/components/ui";

import { decrypt } from "@/utils";

export function SecretKeyPrompt({
  open,
  toggle,
  onSubmit,
  credentialSample,
}: {
  open: boolean;
  toggle: (value?: boolean) => void;
  onSubmit: (key: string, validKey: boolean) => void;
  credentialSample?: idOSCredential | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkForValidity = () => {
    try {
      if (!key || !credentialSample) return false;
      const isValid = decrypt(credentialSample.content, credentialSample.encryptor_public_key, key);
      return !!isValid;
    } catch (error) {
      return false;
    }
  };

  const handleSave = () => {
    setLoading(true);
    const isValid = checkForValidity();
    setHasError(!isValid);
    setLoading(false);
    if (isValid) {
      onSubmit(key, isValid);
      toggle(false);
    }
  };

  const resetState = () => {
    setKey("");
    setHasError(false);
  };

  return (
    <DialogRoot
      open={open}
      placement="center"
      onOpenChange={() => {
        toggle(false);
        resetState();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your secret key</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap="4">
            <Field label="Secret key:">
              <PasswordInput ref={ref} onChange={(e) => setKey(e.target.value)} />
            </Field>
            {hasError && (
              <Text color="red.500" fontSize="sm" fontWeight="semibold">
                Can't decrypt credential — please make sure you're using the right encryption key
              </Text>
            )}
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button loading={loading} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
