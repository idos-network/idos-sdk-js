import { HStack, VStack, chakra } from "@chakra-ui/react";

import { DisconnectedIcon } from "@/components/icons/disconnected";
import { ExclamationMarkIcon } from "@/components/icons/exclamation-mark";
import { ProfileIcon } from "@/components/icons/profile";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useIsleStore } from "@/store";

/**
 * @todo: fine-tune the colors
 */
function ProfileStatusIcon() {
  const status = useIsleStore((state) => state.status);

  if (status === "disconnected") {
    return <DisconnectedIcon color="gray" />;
  }

  if (status === "no-profile") {
    return <ProfileIcon color="gray" />;
  }

  if (status === "not-verified") {
    return <ProfileIcon color="red" />;
  }

  if (status === "pending-verification") {
    return <ProfileIcon color="yellow.500" />;
  }

  if (status === "error") {
    return <ExclamationMarkIcon color="red" />;
  }

  return <ProfileIcon color="aquamarine" />;
}

// @todo: fine-tune the colors for the text color and the badge bg
function StatusBadge() {
  const status = useIsleStore((state) => state.status);

  return (
    <Badge bg={{ _light: "neutral.200", _dark: "neutral.800" }} size="sm" textTransform="uppercase">
      {status.split("-").join(" ")}
    </Badge>
  );
}
export function Header() {
  return (
    <chakra.header
      display={{ base: "none", sm: "flex" }}
      id="header"
      alignItems="start"
      justifyContent="space-between"
      gap="5"
    >
      <HStack gap="2">
        <Logo />
        <VStack alignItems="flex-start" gap="1">
          <chakra.span fontSize="lg" fontWeight="semibold">
            idOS
          </chakra.span>
          <StatusBadge />
        </VStack>
      </HStack>
      <ProfileStatusIcon />
    </chakra.header>
  );
}
