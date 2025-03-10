import { chakra } from "@chakra-ui/react";
import * as motion from "motion/react-client";
import { type PropsWithChildren, useState } from "react";
import { ProfileStatusIcon } from "./header";
import { Logo } from "./logo";

const MotionBox = chakra(motion.div);

export default function Minimized({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <MotionBox
      display="flex"
      gap={1}
      borderRadius="46px"
      width="74px"
      height="42px"
      alignItems="start"
      border="1px solid"
      borderColor={{
        _dark: "neutral.800",
        _light: "neutral.50",
      }}
      overflow="hidden"
      bg="transparent"
      whileHover={{
        width: "380px",
        minHeight: 100,
        height: isExpanded ? "auto" : 100,
        borderRadius: "38px",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <MotionBox
        style={{
          display: isExpanded ? "flex" : "none",
        }}
      >
        {children}
      </MotionBox>
      <MotionBox
        bg={{
          _dark: "neutral.950",
          _light: "white",
        }}
        display={!isExpanded ? "flex" : "none"}
        padding="4px"
        w="full"
        gap="1"
        alignItems="center"
      >
        <Logo size="sm" />
        <ProfileStatusIcon />
      </MotionBox>
    </MotionBox>
  );
}
