import { Disclaimer } from "@/components/disclaimer";
import { GranteeInfo } from "@/components/grantee-info";
import { IdentityIcon } from "@/components/icons/identity";
import { KYCInfo } from "@/components/kyc-info";
import { Box, HStack, Stack, Text, VStack } from "@chakra-ui/react";

function RequestedPermissions({ values }: { values: string[] }) {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} p="4" borderRadius="3xl">
      <VStack gap="2" alignItems="stretch">
        <HStack gap="2.5" alignItems="flex-start">
          <IdentityIcon w="5" h="5" />
          <Text fontSize="sm" fontWeight="medium">
            Grant access to your KYC data including:
          </Text>
        </HStack>
        <Box pl="7">
          <KYCInfo values={values} />
        </Box>
      </VStack>
    </Stack>
  );
}

interface RequestPermissionProps {
  grantee: {
    url: string;
    name: string;
    logo: string;
  };
  permissions: string[];
}
export function RequestPermission({ grantee, permissions }: RequestPermissionProps) {
  return (
    <Stack gap="6">
      <Stack gap="4">
        <GranteeInfo name={grantee.name} logo={grantee.logo} />
        <Stack gap="2">
          <RequestedPermissions values={permissions} />
          <Disclaimer name={grantee.name} logo={grantee.logo} />
        </Stack>
      </Stack>
    </Stack>
  );
}
