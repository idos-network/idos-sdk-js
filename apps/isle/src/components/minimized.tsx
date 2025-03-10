import { useOutsideClickHandler } from "@/hooks/use-outside-click";
import { useIsleStore } from "@/store";
import { chakra } from "@chakra-ui/react";
import * as motion from "motion/react-client";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { ProfileStatusIcon } from "./header";
import { Logo } from "./logo";

const MotionBox = chakra(motion.div);

export default function Minimized({ children }: PropsWithChildren) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noDismiss, setNoDismiss] = useState(false);

  const node = useIsleStore((state) => state.node);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = (_isExpanded?: boolean) => {
    if (noDismiss) return;
    _isExpanded === undefined ? setIsExpanded(!isExpanded) : setIsExpanded(_isExpanded);
  };

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
      onClick={toggle}
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
