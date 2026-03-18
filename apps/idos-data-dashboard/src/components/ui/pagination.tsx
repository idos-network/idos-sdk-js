"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("flex w-full items-center justify-center gap-2", className)}
      data-slot="pagination"
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = Omit<React.ComponentProps<typeof Link>, "to"> & {
  isActive?: boolean;
  size?: "default" | "sm" | "icon" | "lg" | "icon-sm";
  disabled?: boolean;
  to?: React.ComponentProps<typeof Link>["to"];
};

function PaginationLink({
  className,
  isActive,
  size = "default",
  disabled,
  to,
  ...props
}: PaginationLinkProps) {
  const classNames = cn(
    buttonVariants({
      size,
      variant: isActive ? "outline" : "ghost",
    }),
    "min-w-8",
    disabled && "pointer-events-none opacity-50",
    className,
  );
  if (disabled || to == null) {
    return (
      <span
        aria-current={isActive ? "page" : undefined}
        aria-disabled={disabled}
        className={classNames}
        data-active={isActive}
        data-slot="pagination-link"
      >
        {props.children}
      </span>
    );
  }
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={classNames}
      data-active={isActive}
      data-slot="pagination-link"
      to={to}
      {...props}
    />
  );
}

type PaginationPreviousProps = Omit<PaginationLinkProps, "children"> & {
  children?: React.ReactNode;
};

function PaginationPrevious({
  className,
  children = (
    <>
      <ChevronLeftIcon className="size-4" />
      <span className="sr-only">Previous</span>
    </>
  ),
  disabled,
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("size-8 min-w-8 p-0", className)}
      disabled={disabled}
      size="icon"
      {...props}
    >
      {children}
    </PaginationLink>
  );
}

type PaginationNextProps = Omit<PaginationLinkProps, "children"> & {
  children?: React.ReactNode;
};

function PaginationNext({
  className,
  children = (
    <>
      <span className="sr-only">Next</span>
      <ChevronRightIcon className="size-4" />
    </>
  ),
  disabled,
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("size-8 min-w-8 p-0", className)}
      disabled={disabled}
      size="icon"
      {...props}
    >
      {children}
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      …
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
