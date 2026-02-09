import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/success")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard",
    });
  },
});
