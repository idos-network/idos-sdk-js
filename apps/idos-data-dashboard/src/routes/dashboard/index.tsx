import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: () => <Navigate to="/credentials" />,
});
