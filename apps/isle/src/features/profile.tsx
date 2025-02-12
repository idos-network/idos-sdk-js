import { Center, Spinner } from "@chakra-ui/react";
import { hasProfile } from "@idos-network/kwil-actions/user";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useAccount } from "wagmi";

import { statusAtom } from "@/atoms/account";
import { CreateProfile } from "@/features/create-profile";
import { useKwilActionsClient } from "@/kwil-actions.provider";
import { Permissions } from "./permissions";

const useHasProfile = () => {
  const { address } = useAccount();
  const { client } = useKwilActionsClient();

  return useQuery({
    queryKey: ["has-profile"],
    queryFn: () => hasProfile(client, address as string),
  });
};

export function Profile() {
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
  return <Permissions />;
}
