import { Stack, Text } from "@chakra-ui/react";

export function KYCInfo({ values }: { values: string[] }) {
  return (
    <Stack gap="2">
      <Stack gap="1">
        {values.map((value) => (
          <Text key={value} fontSize="xs" color="muted.fg">
            {value}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
