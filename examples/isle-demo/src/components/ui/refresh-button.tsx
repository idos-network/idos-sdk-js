import type { ButtonProps as ChakraRefreshButtonProps } from "@chakra-ui/react";
import { IconButton as ChakraIconButton } from "@chakra-ui/react";
import { forwardRef } from "react";
import { LuRotateCw } from "react-icons/lu";

export interface RefreshButtonProps extends ChakraRefreshButtonProps {}

export const RefreshButton = forwardRef<HTMLButtonElement, ChakraRefreshButtonProps>(
  function RefreshButton(props, ref) {
    return (
      <ChakraIconButton
        aria-label="Refresh"
        title="Refresh"
        color="white"
        variant="ghost"
        ref={ref}
        {...props}
      >
        {props.children ?? <LuRotateCw />}
      </ChakraIconButton>
    );
  },
);
