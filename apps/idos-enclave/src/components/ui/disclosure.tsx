import {
  type DisclosureButtonProps,
  type DisclosurePanelProps,
  type DisclosureProps,
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from "@headlessui/react";

export function Disclosure(props: DisclosureProps) {
  return (
    <HeadlessDisclosure
      as="div"
      className="flex flex-col gap-2 rounded-md border-2 border-green-400 px-3 py-2"
      {...props}
    />
  );
}

export function DisclosureButton(props: DisclosureButtonProps) {
  return (
    <HeadlessDisclosureButton
      className="flex cursor-pointer flex-row items-center justify-between"
      {...props}
    />
  );
}

export function DisclosurePanel(props: DisclosurePanelProps) {
  return <HeadlessDisclosurePanel className="flex flex-col" {...props} />;
}
