import { Box, Button, Heading, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";

import { ProfOfPersonhood } from "./proof-of-personhood";

export type NoDataProps = {
  title: string;
  subtitle?: string;
  cta?: string;
};

export const NoData = ({ title, subtitle, cta }: NoDataProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Stack gap={6} p={5} bg="neutral.900" rounded="xl">
      <Heading fontSize="2xl" fontWeight="medium">
        {title}
      </Heading>

      {subtitle ? (
        <Text color="neutral.600" fontSize="2xl">
          {subtitle}
        </Text>
      ) : null}

      {cta ? (
        <Box>
          <Button colorScheme="green" leftIcon={<PlusIcon size={24} />} onClick={onOpen}>
            {cta}
          </Button>
        </Box>
      ) : null}

      <ProfOfPersonhood isOpen={isOpen} onClose={onClose} />
    </Stack>
  );
};
