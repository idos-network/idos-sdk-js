import { chakra } from "@chakra-ui/react";
import { motion } from "motion/react";
import { type PropsWithChildren, useCallback, useEffect, useState } from "react";

import { ProfileStatusIcon } from "@/components/header";
import { Logo } from "@/components/logo";
import { useIsleStore } from "@/store";

const MotionBox = chakra(motion.div);

export default function Minimized({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noDismiss, setNoDismiss] = useState(false);
  const node = useIsleStore((state) => state.node);

  const toggle = useCallback(
    (expanded: boolean) => {
      if (noDismiss) return;
      setIsExpanded(expanded);
    },
    [noDismiss],
  );

  useEffect(() => {
    if (!node) return;

    node.on(
      "toggle-animation",
      ({ expanded, noDismiss }: { expanded: boolean; noDismiss?: boolean }) => {
        setIsExpanded(expanded);
        setNoDismiss(noDismiss ?? false);
      },
    );
  }, [node]);

  return (
    <MotionBox
      paddingBlock={isExpanded ? "10px" : "0px"}
      cursor={isExpanded ? "default" : "pointer"}
      display="flex"
      gap="1"
      rounded="46px"
      width="20"
      height="10"
      mx={!isExpanded ? "1" : "0"}
      alignItems="center"
      border={isExpanded ? undefined : "1px solid {colors.border}"}
      overflow="hidden"
      bg="surface"
      ml="auto"
      animate={
        isExpanded
          ? {
              width: "366px",
              height: "auto",
              borderRadius: "38px",
            }
          : undefined
      }
      onClick={() => toggle(true)}
      shadow={!isExpanded ? "0px 4px 9px -4px #00000066" : ""}
    >
      <MotionBox
        id="minimized-isle"
        bg="surface"
        display={!isExpanded ? "flex" : "none"}
        px="1.5"
        py="1"
        w="full"
        gap="1"
        alignItems="center"
        justifyContent="space-between"
      >
        <Logo size="sm" />
        <ProfileStatusIcon />
      </MotionBox>
      <MotionBox display={isExpanded ? "flex" : "none"} flexDirection="column" gap="1">
        {children}
      </MotionBox>
    </MotionBox>
  );
}
