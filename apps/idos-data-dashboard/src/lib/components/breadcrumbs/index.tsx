import { Box, Flex, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";

export const Breadcrumbs = ({ items }: { items: string[] }) => {
  return (
    <Flex align="center" gap={7}>
      {items.map((item, index) => (
        <Flex key={item} align="center" gap={7}>
          {index === 0 ? undefined : <ChevronRight width={16} height={16} />}
          <Box
            {...(index === items.length - 1
              ? { px: 4, py: 2, bg: "neutral.800", rounded: "full" }
              : {})}
          >
            <Text fontSize="sm">{item}</Text>
          </Box>
        </Flex>
      ))}
    </Flex>
  );
};
