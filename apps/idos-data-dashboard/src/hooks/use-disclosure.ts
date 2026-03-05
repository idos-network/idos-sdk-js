import { useCallback, useState } from "react";

export interface UseDisclosureProps {
  defaultIsOpen?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export default function useDisclosure(props: UseDisclosureProps = {}) {
  const {
    defaultIsOpen = false,
    isOpen: controlledIsOpen,
    onOpen: onOpenProp,
    onClose: onCloseProp,
  } = props;

  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen);

  // If isOpen is provided, it's controlled; otherwise use internal state
  const isOpen = controlledIsOpen ? controlledIsOpen : internalIsOpen;
  const isControlled = controlledIsOpen;

  const onOpen = useCallback(() => {
    if (!isControlled) {
      setInternalIsOpen(true);
    }
    onOpenProp?.();
  }, [isControlled, onOpenProp]);

  const onClose = useCallback(() => {
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    onCloseProp?.();
  }, [isControlled, onCloseProp]);

  const onToggle = useCallback(() => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  }, [isOpen, onOpen, onClose]);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    isControlled,
  };
}
