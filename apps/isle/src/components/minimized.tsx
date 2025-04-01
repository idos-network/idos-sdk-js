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

        if (noDismiss !== undefined) {
          setNoDismiss(noDismiss);
        }
      },
    );
  }, [node]);

  return (
    <MotionBox
      cursor={isExpanded ? "default" : "pointer"}
      display="flex"
      gap="1"
      rounded="46px"
      width="20"
      height="10"
      alignItems="center"
      border="1px solid {colors.border}"
      shadow="sm"
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
    >
      <MotionBox
        id="minimized-isle"
        bg="surface"
        display={!isExpanded ? "flex" : "none"}
        padding="1"
        w="full"
        gap="1"
        alignItems="center"
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
