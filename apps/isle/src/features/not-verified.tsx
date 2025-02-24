import { IdentityIcon } from "@/components/icons/identity";
import { KeyIcon } from "@/components/icons/key";
import { Stepper } from "@/components/ui";
import { Circle } from "./permissions";

import { Flex, Heading, Stack, Text } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

function Disclaimer() {
  return (
    <Flex
      gap="2"
      bg={{ _dark: "neutral.800", _light: "neutral.200" }}
      p="4"
      borderRadius="3xl"
      alignItems="center"
    >
      <Circle icon="/common.svg" />
      <Text fontSize="xs" color="neutral.500">
        Make sure you trust Common, as you may be sharing sensitive data with this site or app.
      </Text>
    </Flex>
  );
}

function KycInfo({ values }: { values: string[] }) {
  return (
    <Stack gap="2">
      <Stack gap="1">
        {values.map((value) => (
          <Text key={value} fontSize="xs" color="neutral.500">
            {value}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

function PermissionAsk({
  title,
  icon,
  children,
}: PropsWithChildren<{ title: string; icon: JSX.Element }>) {
  return (
    <Stack gap="2">
      <Flex gap="2.5" alignItems="start">
        {icon}
        <Stack gap="2">
          <Text fontSize="sm" fontWeight="medium">
            {title}
          </Text>
          {children}
        </Stack>
      </Flex>
    </Stack>
  );
}

function PermissionsToAsk() {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} p="4" borderRadius="3xl">
      <PermissionAsk
        title="Add one credential to your idOS Profile"
        icon={<KeyIcon w="4" h="4" />}
      />
      <PermissionAsk
        title="Grant access to your KYC data, including:"
        icon={<IdentityIcon w="4" h="4" />}
      >
        <KycInfo
          values={[
            "Name and last name",
            "Gender",
            "Country and city of residence",
            "Place and date of birth",
            "ID Document",
            "Liveness check (No pictures)",
          ]}
        />
      </PermissionAsk>
    </Stack>
  );
}

function Header() {
  return (
    <Flex gap="2.5" alignItems="center">
      <Circle icon="/common.svg" />
      <Text gap="1" alignItems="baseline" display="flex">
        <Text as="span" fontWeight="medium" fontSize="lg">
          Common
        </Text>
        <Text as="span" fontSize="sm">
          is asking for permissions to:
        </Text>
      </Text>
    </Flex>
  );
}

export function NotVerified() {
  return (
    <Stack gap="6">
      <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
        Share access to your data
      </Heading>
      <Stepper stepsLength={3} index={1} />
      <Text color="neutral.500" fontSize="sm" textAlign="center" fontWeight="medium">
        To proceed, please confirm in your wallet.
      </Text>
      <Stack gap="4">
        <Header />
        <Stack gap="2">
          <PermissionsToAsk />
          <Disclaimer />
        </Stack>
      </Stack>
    </Stack>
  );
}
