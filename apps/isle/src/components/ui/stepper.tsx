import { Flex, Grid } from "@chakra-ui/react";

const StepperCircle = ({ active }: { active?: boolean }) => {
  return (
    <Grid
      w={6}
      h={6}
      rounded="full"
      placeItems="center"
      bg={active ? "aquamarine.950" : "neutral.800"}
      zIndex={2}
    >
      <Flex w={2} h={2} rounded="full" bg={active ? "aquamarine.400" : "neutral.500"} />
    </Grid>
  );
};

export function Stepper({
  stepsLength = 3,
  index: activeIndex = 1,
}: { stepsLength?: number; index?: number }) {
  const stepsArray = Array.from({ length: stepsLength }, (_, i) => i + 1);
  return (
    <Flex position="relative" justifyContent="space-between" maxW={208} mx="auto" w="full">
      <Flex position="absolute" top="3" left="0" minH="1px" w="full" bg="neutral.500" zIndex={1} />
      {stepsArray.map((step, index) => (
        <StepperCircle key={step} active={activeIndex >= index} />
      ))}
    </Flex>
  );
}
