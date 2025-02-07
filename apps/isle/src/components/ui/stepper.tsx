import { chakra } from "@chakra-ui/react";

const StepperCircle = ({ active }: { active?: boolean }) => {
  return (
    <chakra.div
      w={6}
      h={6}
      rounded="full"
      display="grid"
      placeItems="center"
      bg={active ? "aquamarine.950" : "neutral.800"}
      zIndex={2}
    >
      <chakra.div w={2} h={2} rounded="full" bg={active ? "aquamarine.400" : "neutral.500"} />
    </chakra.div>
  );
};

export function Stepper({
  stepsLength = 3,
  index: activeIndex = 1,
}: { stepsLength?: number; index?: number }) {
  const stepsArray = Array.from({ length: stepsLength }, (_, i) => i + 1);
  return (
    <chakra.div
      display="flex"
      flexDirection="row"
      position="relative"
      justifyContent="space-between"
      maxW={208}
      mx="auto"
    >
      <chakra.div
        position="absolute"
        top="3"
        left="0"
        minH="1px"
        w="full"
        bg="neutral.500"
        zIndex={1}
      />
      {stepsArray.map((step, index) => (
        <StepperCircle key={step} active={activeIndex >= index} />
      ))}
    </chakra.div>
  );
}
