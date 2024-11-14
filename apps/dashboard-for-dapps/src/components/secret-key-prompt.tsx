import { Stack } from "@chakra-ui/react";
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
} from "@idos-network/ui-kit";
import { useRef, useState } from "react";

export default function SecretKeyPrompt({
  open,
  toggle,
  onSubmit,
}: {
  open: boolean;
  toggle: (value?: boolean) => void;
  onSubmit: (key: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [key, setKey] = useState("");

  const handleSave = () => {
    onSubmit(key);
    toggle(false);
  };

  return (
    <DialogRoot
      open={open}
      placement="center"
      onOpenChange={() => {
        toggle(false);
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
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
