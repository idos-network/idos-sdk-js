import { Circle, Flex, Grid } from "@chakra-ui/react";

interface StepperCircleProps {
  active?: boolean;
}

const StepperCircle = ({ active }: StepperCircleProps) => {
  return (
    <Grid
      w="6"
      h="6"
      rounded="full"
      placeItems="center"
      bg={{
        _dark: active ? "aquamarine.950" : "neutral.800",
        _light: active ? "aquamarine.200" : "neutral.200",
      }}
      zIndex="2"
    >
      <Circle size="2" bg={active ? "aquamarine.600" : "neutral.400"} />
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
      <Flex
        position="absolute"
        top="3"
        left="0"
        minH="1px"
        w="full"
        bg={{ _dark: "neutral.500", _light: "neutral.400" }}
        zIndex={1}
      />
      {stepsArray.map((step, index) => (
        <StepperCircle key={step} active={activeIndex >= index} />
      ))}
    </Flex>
  );
}
