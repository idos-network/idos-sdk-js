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
      border={{
        _dark: "1px solid {colors.gray.800}",
        _light: "1px solid {colors.gray.50}",
      }}
      backgroundColor="neutral.950"
      whileHover={{
        width: "fit-content",
        height: "fit-content",
        borderRadius: "38px",
        backgroundColor: "transparent",
        border: "none",
      }}
      onMouseEnter={() =>
        setTimeout(() => {
          setIsExpanded(true);
        }, 200)
      }
      onMouseLeave={() => setIsExpanded(false)}
    >
      {isExpanded ? (
        <MotionBox
          style={{ overflow: "hidden" }}
          initial={{ width: 50, height: 50 }}
          animate={{
            width: "366px",
            height: "500px",
            maxHeight: "auto",
          }}
        >
          {children}
        </MotionBox>
      ) : (
        <motion.div
          style={{
            padding: "4px",
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Logo size="sm" />
          <DisconnectedIcon color="gray.500" />
        </motion.div>
      )}
    </MotionBox>
  );
}
