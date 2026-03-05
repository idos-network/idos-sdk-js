import { XIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

export function EnclaveDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const enclaveRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const enclaveCallbackRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();

    enclaveRef.current = node;
    if (!node) {
      return;
    }

    const observer = new MutationObserver(() => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const visible = node.classList.contains("visible");
      if (visible && !dialog.open) {
        document.body.style.overflow = "hidden";
        dialog.showModal();
      }
      if (!visible && dialog.open) {
        dialog.close();
        document.body.style.overflow = "";
      }
    });

    observer.observe(node, { attributes: true, attributeFilter: ["class"] });
    observerRef.current = observer;
  }, []);

  const handleClose = () => {
    if (enclaveRef.current?.classList.contains("visible")) {
      document.dispatchEvent(new CustomEvent("idos:enclave-dismissed"));
    }
    dialogRef.current?.close();
    document.body.style.overflow = "";
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: onClick handles backdrop dismiss; keyboard close is handled via onCancel (Escape).
    <dialog
      ref={dialogRef}
      aria-labelledby="enclave-dialog-title"
      className="fixed inset-0 z-50 m-0 hidden h-full max-h-full w-full max-w-full grid-rows-[1fr_auto_3fr] justify-items-center border-none bg-transparent p-4 backdrop:bg-black/10 open:grid backdrop:supports-backdrop-filter:backdrop-blur-xs max-sm:grid-rows-[1fr_auto] max-sm:p-0 max-sm:pt-12"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div className="relative row-start-2 grid max-h-[90vh] w-full max-w-sm gap-6 overflow-auto rounded-xl bg-card p-5 text-card-foreground text-sm outline-none ring-1 ring-foreground/10 max-sm:max-h-[calc(100vh-3rem)] max-sm:max-w-none max-sm:rounded-b-none">
        <div data-slot="dialog-header" className="flex flex-col gap-4 font-medium text-xl">
          <h2
            id="enclave-dialog-title"
            data-slot="dialog-title"
            className="font-medium text-accent-foreground text-base leading-none"
          >
            Access your idOS data
          </h2>
          <p data-slot="dialog-description" className="text-accent-foreground text-sm">
            Please click the button below to continue.
          </p>
        </div>
        <div
          id="idOS-enclave"
          ref={enclaveCallbackRef}
          className="flex h-10 overflow-clip rounded-md"
        />
        <Button
          data-slot="dialog-close"
          variant="ghost"
          className="absolute top-2 right-2 text-accent-foreground"
          size="icon-lg"
          onClick={handleClose}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </dialog>
  );
}
