import { createFileRoute } from "@tanstack/react-router";
import { CredentialsSection } from "./credentials";

export const Route = createFileRoute("/dashboard/")({
  component: CredentialsSection,
});
