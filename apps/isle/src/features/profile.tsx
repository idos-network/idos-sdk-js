import { Button, Center, Heading, Spinner } from "@chakra-ui/react";
import { hasProfile } from "@idos-network/kwil-actions/user";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useAccount, useDisconnect } from "wagmi";

import { statusAtom } from "@/atoms/account";
import { CreateProfile } from "@/features/create-profile";
import { useKwilActionsClient } from "@/kwil-actions.provider";

const useHasProfile = () => {
  const { address } = useAccount();
  const { client } = useKwilActionsClient();

  return useQuery({
    queryKey: ["has-profile"],
    queryFn: () => hasProfile(client, address as string),
  });
};

export function Profile() {
  const { disconnect } = useDisconnect();
  const { data, isPending } = useHasProfile();
  const setStatus = useSetAtom(statusAtom);

  if (isPending) {
    return (
      <Center flexDir="column" gap="6" h="120px">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!data) {
    setStatus("no profile");
    return <CreateProfile />;
  }

  return (
    <Center flexDir="column" gap="6">
      <Heading fontSize="2xl" fontWeight="bold">
        User profile
      </Heading>

      <Button colorPalette="green" variant="subtle" w="full" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </Center>
  );
}
