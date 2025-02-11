import { chakra } from "@chakra-ui/react";
import * as motion from "motion/react-client";
import { type PropsWithChildren, useState } from "react";
import { DisconnectedIcon } from "./icons/disconnected";
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
      backgroundColor="neutral.950"
      whileHover={{
        width: "366px",
        height: "400px",
        borderRadius: "38px",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <MotionBox
        style={{
          display: isExpanded ? "flex" : "none",
          width: "366px",
          height: "400px",
        }}
      >
        {children}
      </MotionBox>
      <motion.div
        style={{
          padding: "4px",
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          display: !isExpanded ? "flex" : "none",
        }}
      >
        <Logo size="sm" />
        <DisconnectedIcon color="gray.500" />
      </motion.div>
    </MotionBox>
  );
}
