import { useOutsideClickHandler } from "@/hooks/use-outside-click";
import { useIsleStore } from "@/store";
import { chakra } from "@chakra-ui/react";
import * as motion from "motion/react-client";
import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

import { ProfileStatusIcon } from "./header";
import { Logo } from "./logo";

const MotionBox = chakra(motion.div);

export default function Minimized({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noDismiss, setNoDismiss] = useState(false);

  const node = useIsleStore((state) => state.node);
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const toggle = useCallback(
    (_isExpanded: boolean) => {
      if (noDismiss) return;
      setIsExpanded(_isExpanded);
    },
    [noDismiss],
  );

  useOutsideClickHandler(ref, () => toggle(false));

  useEffect(() => {
    if (!node) return;
    node.on(
      "toggle-animation",
      ({ expanded, noDismiss }: { expanded: boolean; noDismiss?: boolean }) => {
        setIsExpanded(expanded);
        setNoDismiss(!!noDismiss);
      },
    );
  }, [node]);

  return (
    <MotionBox
      ref={ref}
      cursor={isExpanded ? "default" : "pointer"}
      display="flex"
      gap="1"
      borderRadius="46px"
      width="80px"
      height="40px"
      alignItems="center"
      border="1px solid"
      ml="auto"
      shadow="sm"
      borderColor={{
        _dark: "neutral.700",
        _light: "neutral.200",
      }}
      overflow="hidden"
      bg={{
        _dark: "neutral.950",
        _light: "white",
      }}
      animate={
        isExpanded
          ? {
              width: "380px",
              minHeight: 100,
              height: "auto",
              borderRadius: "38px",
            }
          : undefined
      }
      onClick={() => toggle(true)}
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
