"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonGroupVariants = cva(
  "bg-background flex w-fit items-center overflow-hidden rounded-lg border border-border",
  {
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
});

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: VariantProps<typeof buttonGroupVariants>["orientation"];
}) {
  return (
    <div
      className={cn(buttonGroupVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
      {...props}
    />
  );
}

export { ButtonGroup };
